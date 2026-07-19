import { db } from "@gbam/database/client";
import {
  type DashboardResponse,
  type DashboardSessionItem,
  type DashboardSessionStatus,
  type DashboardTransactionItem,
  type ModeType,
} from "@gbam/shared";
import { getAvailableCreditsBalance } from "./polar";
import { syncProviderCreditsBalance } from "./credits-ledger";

type SessionRow = {
  id: string;
  title: string;
  lastMode: string | null;
  lastModel: string | null;
  status: string | null;
  lastActivityAt: Date | null;
  updatedAt: Date;
  creditsUsed: number | null;
};

type MonthlyCreditsRow = {
  total: number | bigint | null;
};

type TransactionRow = {
  id: string;
  type: string;
  creditsDelta: number;
  description: string | null;
  sessionId: string | null;
  createdAt: Date;
};

type CreditAccountSnapshotRow = {
  providerBalanceCredits: number | null;
  lastReconciledAt: Date | null;
};

function normalizeStatus(value: string | null): DashboardSessionStatus {
  if (value === "complete" || value === "waiting" || value === "new") {
    return value;
  }

  return "new";
}

function toSessionItem(session: SessionRow): DashboardSessionItem {
  return {
    id: session.id,
    title: session.title,
    lastMode: (session.lastMode as ModeType | null) ?? null,
    lastModel: session.lastModel,
    status: normalizeStatus(session.status),
    lastActivityAt: (session.lastActivityAt ?? session.updatedAt).toISOString(),
    creditsUsed: session.creditsUsed ?? 0,
  };
}

function toTransactionItem(transaction: TransactionRow): DashboardTransactionItem {
  return {
    id: transaction.id,
    type: transaction.type as DashboardTransactionItem["type"],
    creditsDelta: transaction.creditsDelta,
    description: transaction.description,
    sessionId: transaction.sessionId,
    createdAt: transaction.createdAt.toISOString(),
  };
}

export async function getDashboardData(userId: string): Promise<DashboardResponse> {
  let creditsBalance = 0;
  let lastCreditsSyncedAt: string | null = null;

  try {
    creditsBalance = await getAvailableCreditsBalance(userId);
    await syncProviderCreditsBalance(userId, creditsBalance);
    lastCreditsSyncedAt = new Date().toISOString();
  } catch (error) {
    console.error("Failed to fetch live credits balance for dashboard", { error, userId });
  }

  if (lastCreditsSyncedAt == null) {
    const accountRows = await db.$queryRaw<CreditAccountSnapshotRow[]>`
      SELECT "providerBalanceCredits", "lastReconciledAt"
      FROM "CreditAccount"
      WHERE "userId" = ${userId}
      LIMIT 1
    `;

    const account = accountRows[0];
    if (account) {
      creditsBalance = account.providerBalanceCredits ?? creditsBalance;
      lastCreditsSyncedAt = account.lastReconciledAt?.toISOString() ?? null;
    }
  }

  const sessions = await db.$queryRaw<SessionRow[]>`
    SELECT
      "id",
      "title",
      "lastMode",
      "lastModel",
      "status",
      "lastActivityAt",
      "updatedAt",
      "creditsUsed"
    FROM "Session"
    WHERE "userId" = ${userId}
    ORDER BY COALESCE("lastActivityAt", "updatedAt") DESC
    LIMIT 10
  `;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthlyCreditsRows = await db.$queryRaw<MonthlyCreditsRow[]>`
    SELECT COALESCE(SUM(ABS("creditsDelta")), 0) AS "total"
    FROM "CreditTransaction"
    WHERE "userId" = ${userId}
      AND "type" = ${"usage"}
      AND "createdAt" >= ${monthStart}
  `;

  const transactions = await db.$queryRaw<TransactionRow[]>`
    SELECT
      "id",
      "type",
      "creditsDelta",
      "description",
      "sessionId",
      "createdAt"
    FROM "CreditTransaction"
    WHERE "userId" = ${userId}
      AND "type" = ${"usage"}
    ORDER BY "createdAt" DESC
    LIMIT 10
  `;

  const sessionItems = sessions.map(toSessionItem);
  const transactionItems = transactions.map(toTransactionItem);
  const monthlyTotal = Number(monthlyCreditsRows[0]?.total ?? 0);

  return {
    summary: {
      creditsBalance,
      creditsUsedThisMonth: monthlyTotal,
      lastCliActivityAt: sessionItems[0]?.lastActivityAt ?? null,
      lastCreditsSyncedAt,
    },
    sessions: sessionItems,
    transactions: transactionItems,
  };
}
