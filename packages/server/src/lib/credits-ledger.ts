import { db } from "@gbam/database/client";

type CreditAccountRow = {
  balanceCredits: number | null;
  providerBalanceCredits: number | null;
  lastReconciledAt: Date | null;
};

type RecordUsageCreditTransactionParams = {
  userId: string;
  sessionId: string;
  messageId: string;
  credits: number;
  description?: string | null;
  providerReference: string;
  providerBalanceCreditsAfter?: number | null;
};

function createId() {
  return crypto.randomUUID();
}

export async function syncProviderCreditsBalance(userId: string, providerBalanceCredits: number) {
  const now = new Date();

  await db.$executeRaw`
    INSERT INTO "CreditAccount" (
      "id",
      "userId",
      "balanceCredits",
      "providerBalanceCredits",
      "balanceSource",
      "lastReconciledAt",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${createId()},
      ${userId},
      ${providerBalanceCredits},
      ${providerBalanceCredits},
      ${"polar"},
      ${now},
      ${now},
      ${now}
    )
    ON CONFLICT ("userId") DO UPDATE SET
      "balanceCredits" = ${providerBalanceCredits},
      "providerBalanceCredits" = ${providerBalanceCredits},
      "balanceSource" = ${"polar"},
      "lastReconciledAt" = ${now},
      "updatedAt" = ${now}
  `;
}

export async function recordUsageCreditTransaction({
  userId,
  sessionId,
  messageId,
  credits,
  description,
  providerReference,
  providerBalanceCreditsAfter,
}: RecordUsageCreditTransactionParams) {
  const ledgerKey = `usage:${providerReference}`;
  const now = new Date();

  await db.$transaction(async (tx) => {
    // 1. Deduplication Guard
    const existing = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id"
      FROM "CreditTransaction"
      WHERE "ledgerKey" = ${ledgerKey}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return; 
    }

    const accountRows = await tx.$queryRaw<CreditAccountRow[]>`
      SELECT "balanceCredits", "providerBalanceCredits", "lastReconciledAt"
      FROM "CreditAccount"
      WHERE "userId" = ${userId}
      LIMIT 1
    `;

    const currentAccount = accountRows[0];
    const nextBalance =
      providerBalanceCreditsAfter ?? Math.max(0, (currentAccount?.balanceCredits ?? 0) - credits);
    const nextProviderBalance =
      providerBalanceCreditsAfter ?? currentAccount?.providerBalanceCredits ?? null;
    const nextLastReconciledAt =
      providerBalanceCreditsAfter != null ? now : currentAccount?.lastReconciledAt ?? null;

    // 2. Update CreditAccount
    await tx.$executeRaw`
      INSERT INTO "CreditAccount" (
        "id",
        "userId",
        "balanceCredits",
        "providerBalanceCredits",
        "balanceSource",
        "lastReconciledAt",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${createId()},
        ${userId},
        ${nextBalance},
        ${nextProviderBalance},
        ${"polar"},
        ${nextLastReconciledAt},
        ${now},
        ${now}
      )
      ON CONFLICT ("userId") DO UPDATE SET
        "balanceCredits" = ${nextBalance},
        "providerBalanceCredits" = ${nextProviderBalance},
        "balanceSource" = ${"polar"},
        "lastReconciledAt" = ${nextLastReconciledAt},
        "updatedAt" = ${now}
    `;

    // 3. Insert CreditTransaction
    await tx.$executeRaw`
      INSERT INTO "CreditTransaction" (
        "id",
        "userId",
        "type",
        "creditsDelta",
        "balanceAfter",
        "sessionId",
        "messageId",
        "provider",
        "providerReference",
        "ledgerKey",
        "description",
        "metadata",
        "createdAt"
      )
      VALUES (
        ${createId()},
        ${userId},
        ${"usage"},
        ${-credits},
        ${nextBalance},
        ${sessionId},
        ${messageId},
        ${"polar"},
        ${providerReference},
        ${ledgerKey},
        ${description ?? null},
        ${null},
        ${now}
      )
    `;

    // 4. Safely Increment Session creditsUsed
    await tx.$executeRaw`
      UPDATE "Session"
      SET "creditsUsed" = COALESCE("creditsUsed", 0) + ${credits},
          "updatedAt" = ${now}
      WHERE "id" = ${sessionId} AND "userId" = ${userId}
    `;
  });
}