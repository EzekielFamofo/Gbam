import { Prisma } from "@gbam/database";
import { db } from "@gbam/database/client";
import {
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

async function ensureCreditAccountRecord(tx: any, userId: string): Promise<CreditAccountRecord> {
  const existing = await tx.creditAccount.findUnique({ where: { userId } });
  if (existing) {
    return existing as CreditAccountRecord;
  }

  const now = new Date();

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

function toJsonValue(value: Record<string, unknown> | null | undefined) {
  if (!value) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
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
