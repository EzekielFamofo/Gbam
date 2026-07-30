import { Prisma } from "@gbam/database";
import { db } from "@gbam/database/client";
import {
  CREDIT_EXPIRY_MONTHS,
  FREE_TRIAL_CREDITS,
  getCreditPackById,
  getTotalCredits,
  type CreditPackId,
} from "@gbam/shared";

type CreditAccountRecord = {
  userId: string;
  balanceCredits: number;
  providerBalanceCredits: number | null;
  balanceSource: string | null;
  lastReconciledAt: Date | null;
  updatedAt: Date;
};

type RecordUsageCreditTransactionParams = {
  userId: string;
  sessionId: string;
  messageId: string;
  credits: number;
  description?: string | null;
  providerReference: string;
};

type RecordPurchaseCreditTransactionParams = {
  userId: string;
  packId: CreditPackId;
  providerReference: string;
  amountPaidNgn?: number | null;
  metadata?: Record<string, unknown> | null;
};



function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002";
}

function addExpiryWindow(from: Date): Date {
  const expiryDate = new Date(from);
  expiryDate.setMonth(expiryDate.getMonth() + CREDIT_EXPIRY_MONTHS);
  return expiryDate;
}

function toJsonValue(value: Record<string, unknown> | null | undefined) {
  if (!value) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
}

async function ensureCreditAccountRecord(tx: any, userId: string): Promise<CreditAccountRecord> {
  const existing = await tx.creditAccount.findUnique({ where: { userId } });
  if (existing) {
    return existing as CreditAccountRecord;
  }

  const now = new Date();
  const trialExpiresAt = addExpiryWindow(now);

  try {
    const created = await tx.creditAccount.create({
      data: {
        userId,
        balanceCredits: FREE_TRIAL_CREDITS,
        providerBalanceCredits: FREE_TRIAL_CREDITS,
        balanceSource: "internal",
        lastReconciledAt: now,
      },
    });

    // The trial grant needs its own ledger row - not just a number seeded
    // onto CreditAccount - so it has something for the expiry sweep to find
    // and something for the dashboard transaction history to display.
    await tx.creditTransaction.create({
      data: {
        userId,
        type: "trial",
        creditsDelta: FREE_TRIAL_CREDITS,
        balanceAfter: FREE_TRIAL_CREDITS,
        remainingCredits: FREE_TRIAL_CREDITS,
        expiresAt: trialExpiresAt,
        provider: "internal",
        ledgerKey: `trial:${userId}`,
        description: "Free trial credits",
        createdAt: now,
      },
    });

    return created as CreditAccountRecord;
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const createdByAnotherRequest = await tx.creditAccount.findUnique({ where: { userId } });
    if (!createdByAnotherRequest) {
      throw error;
    }

    return createdByAnotherRequest as CreditAccountRecord;
  }
}

/**
 * Consumes credits FIFO across the user's non-expired inbound ledger rows,
 * oldest (== soonest-expiring, since every grant gets the same window) first.
 * Locks candidate rows with FOR UPDATE so two concurrent debits can't both
 * read the same remainingCredits and double-spend the same batch.
 */
async function consumeCreditsFifo(
  tx: any,
  userId: string,
  amount: number,
): Promise<{ consumed: number }> {
  if (amount <= 0) return { consumed: 0 };

  const now = new Date();

  const candidates = await tx.$queryRaw<{ id: string; remainingCredits: number }[]>`
    SELECT "id", "remainingCredits"
    FROM "CreditTransaction"
    WHERE "userId" = ${userId}
      AND "remainingCredits" > 0
      AND ("expiresAt" IS NULL OR "expiresAt" > ${now})
    ORDER BY "createdAt" ASC
    FOR UPDATE
  `;

  let remainingToConsume = amount;

  for (const row of candidates) {
    if (remainingToConsume <= 0) break;
    const amountTaken = Math.min(row.remainingCredits, remainingToConsume);

    await tx.creditTransaction.update({
      where: { id: row.id },
      data: { remainingCredits: { decrement: amountTaken } },
    });

    remainingToConsume -= amountTaken;
  }

  return { consumed: amount - remainingToConsume };
}

export async function ensureCreditAccount(userId: string) {
  return db.$transaction(async (tx) => ensureCreditAccountRecord(tx, userId));
}

export async function getAvailableCreditsBalance(userId: string) {
  const account = await ensureCreditAccount(userId);
  return account.balanceCredits;
}

export async function getCreditAccountSnapshot(userId: string) {
  return ensureCreditAccount(userId);
}

// Backwards-compatible helper kept for legacy call sites. It now mirrors the
// local ledger balance instead of treating an external provider as source-of-truth.
export async function syncProviderCreditsBalance(userId: string, providerBalanceCredits: number) {
  const now = new Date();

  await db.creditAccount.upsert({
    where: { userId },
    create: {
      userId,
      balanceCredits: providerBalanceCredits,
      providerBalanceCredits,
      balanceSource: "internal",
      lastReconciledAt: now,
    },
    update: {
      balanceCredits: providerBalanceCredits,
      providerBalanceCredits,
      balanceSource: "internal",
      lastReconciledAt: now,
    },
  });
}

export async function recordUsageCreditTransaction({
  userId,
  sessionId,
  messageId,
  credits,
  description,
  providerReference,
}: RecordUsageCreditTransactionParams) {
  if (credits <= 0) {
    return;
  }

  const ledgerKey = `usage:${providerReference}`;
  const now = new Date();

  try {
    await db.$transaction(async (tx) => {
      const account = await ensureCreditAccountRecord(tx, userId);

      const { consumed } = await consumeCreditsFifo(tx, userId, credits);
      if (consumed < credits) {
        // Ledger and cached balance disagree - shouldn't happen if grant/
        // debit/expire stay the only three mutators, but don't block the
        // request over it; flag it loudly so it gets investigated.
        console.error("[credits-ledger] FIFO consumption shortfall", {
          userId,
          requested: credits,
          consumed,
        });
      }

      const nextBalance = Math.max(0, account.balanceCredits - credits);

      await tx.creditAccount.update({
        where: { userId },
        data: {
          balanceCredits: nextBalance,
          providerBalanceCredits: nextBalance,
          balanceSource: account.balanceSource ?? "internal",
          lastReconciledAt: now,
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          type: "usage",
          creditsDelta: -credits,
          balanceAfter: nextBalance,
          sessionId,
          messageId,
          provider: "internal",
          providerReference,
          ledgerKey,
          description: description ?? null,
          metadata: undefined,
          createdAt: now,
        },
      });

      await tx.session.updateMany({
        where: { id: sessionId, userId },
        data: {
          creditsUsed: {
            increment: credits,
          },
          updatedAt: now,
        },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return;
    }

    throw error;
  }
}

export async function recordPurchaseCreditTransaction({
  userId,
  packId,
  providerReference,
  amountPaidNgn,
  metadata,
}: RecordPurchaseCreditTransactionParams) {
  const pack = getCreditPackById(packId);
  if (!pack) {
    throw new Error(`Unknown credit pack: ${packId}`);
  }

  const creditsAdded = getTotalCredits(pack);
  const ledgerKey = `purchase:paystack:${providerReference}`;
  const now = new Date();
  const expiresAt = addExpiryWindow(now);
  const transactionMetadata = toJsonValue({
    packId,
    packLabel: pack.label,
    baseCredits: pack.baseCredits,
    bonusCredits: pack.bonusCredits,
    totalCredits: creditsAdded,
    amountPaidNgn: amountPaidNgn ?? pack.retailPriceNgn,
    ...(metadata ?? {}),
  });

  try {
    await db.$transaction(async (tx) => {
      const account = await ensureCreditAccountRecord(tx, userId);
      const nextBalance = account.balanceCredits + creditsAdded;

      await tx.creditAccount.update({
        where: { userId },
        data: {
          balanceCredits: nextBalance,
          providerBalanceCredits: nextBalance,
          balanceSource: "paystack",
          lastReconciledAt: now,
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          type: "purchase",
          creditsDelta: creditsAdded,
          balanceAfter: nextBalance,
          remainingCredits: creditsAdded,
          expiresAt,
          provider: "paystack",
          providerReference,
          ledgerKey,
          description: `${pack.label} credit pack purchase`,
          metadata: transactionMetadata,
          createdAt: now,
        },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return;
    }

    throw error;
  }
}

/**
 * Finds inbound ledger rows past their expiry with unused credits remaining,
 * zeroes them, writes a matching "expiration" row, and decrements the
 * owning account's cached balance to match. Intended to run on a daily cron.
 */
export async function sweepExpiredCredits(): Promise<{ usersAffected: number; creditsExpired: number }> {
  const now = new Date();
  const affectedUsers = new Set<string>();
  let creditsExpired = 0;

  const expiredRows = await db.$queryRaw<{ id: string; userId: string; remainingCredits: number }[]>`
    SELECT "id", "userId", "remainingCredits"
    FROM "CreditTransaction"
    WHERE "remainingCredits" > 0
      AND "expiresAt" IS NOT NULL
      AND "expiresAt" < ${now}
  `;

  for (const row of expiredRows) {
    const amount = row.remainingCredits;
    if (amount <= 0) continue;

    try {
      await db.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<{ id: string; remainingCredits: number }[]>`
          SELECT "id", "remainingCredits"
          FROM "CreditTransaction"
          WHERE "id" = ${row.id}
            AND "remainingCredits" > 0
          FOR UPDATE
        `;
        const current = locked[0];
        if (!current) return; // already swept by a concurrent run

        await tx.creditTransaction.update({
          where: { id: row.id },
          data: { remainingCredits: 0 },
        });

        const account = await ensureCreditAccountRecord(tx, row.userId);
        const nextBalance = Math.max(0, account.balanceCredits - current.remainingCredits);

        await tx.creditAccount.update({
          where: { userId: row.userId },
          data: {
            balanceCredits: nextBalance,
            providerBalanceCredits: nextBalance,
            lastReconciledAt: now,
          },
        });

        await tx.creditTransaction.create({
          data: {
            userId: row.userId,
            type: "expiration",
            creditsDelta: -current.remainingCredits,
            balanceAfter: nextBalance,
            provider: "internal",
            ledgerKey: `expiration:${row.id}`,
            description: "Unused credits expired",
            createdAt: now,
          },
        });
      });

      creditsExpired += amount;
      affectedUsers.add(row.userId);
    } catch (error) {
      if (isUniqueConstraintError(error)) continue; // already processed
      console.error("[credits-ledger] Failed to expire credit grant", { error, rowId: row.id, userId: row.userId });
    }
  }

  return { usersAffected: affectedUsers.size, creditsExpired };
}