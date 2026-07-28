import { db } from "@gbam/database/client";
import {
  type DashboardResponse,
  type DashboardSessionItem,
  type DashboardSessionStatus,
  type DashboardTransactionItem,
  type ModeType,
} from "@gbam/shared";
import { getCreditAccountSnapshot } from "./credits-ledger";

type SessionRow = {
  id: string;
  title: string;
  lastMode: string | null;
  lastModel: string | null;
  status: string | null;
  lastActivityAt: Date | null;
  updatedAt: Date;
  creditsUsed: number | null;
  projectPath: string | null;
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
    projectPath: session.projectPath,
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
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [account, sessions, monthlyCreditsRows, transactions] = await Promise.all([
    getCreditAccountSnapshot(userId),
    db.$queryRaw<SessionRow[]>`
      SELECT
        "id",
        "title",
        "lastMode",
        "lastModel",
        "status",
        "lastActivityAt",
        "updatedAt",
        "creditsUsed",
        "projectPath"
      FROM "Session"
      WHERE "userId" = ${userId}
      ORDER BY COALESCE("lastActivityAt", "updatedAt") DESC
      LIMIT 10
    `,
    db.$queryRaw<MonthlyCreditsRow[]>`
      SELECT COALESCE(SUM(ABS("creditsDelta")), 0) AS "total"
      FROM "CreditTransaction"
      WHERE "userId" = ${userId}
        AND "type" = ${"usage"}
        AND "createdAt" >= ${monthStart}
    `,
    db.$queryRaw<TransactionRow[]>`
      SELECT
        "id",
        "type",
        "creditsDelta",
        "description",
        "sessionId",
        "createdAt"
      FROM "CreditTransaction"
      WHERE "userId" = ${userId}
      ORDER BY "createdAt" DESC
      LIMIT 10
    `,
  ]);

  const sessionItems = sessions.map(toSessionItem);
  const transactionItems = transactions.map(toTransactionItem);
  const monthlyTotal = Number(monthlyCreditsRows[0]?.total ?? 0);

  return {
    summary: {
      creditsBalance: account.balanceCredits,
      creditsUsedThisMonth: monthlyTotal,
      lastCliActivityAt: sessionItems[0]?.lastActivityAt ?? null,
      lastCreditsSyncedAt: account.lastReconciledAt?.toISOString() ?? account.updatedAt.toISOString(),
    },
    sessions: sessionItems,
    transactions: transactionItems,
  };
}
