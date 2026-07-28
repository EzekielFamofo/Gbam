import type { ModeType } from "./schemas";

export type DashboardSummary = {
  creditsBalance: number;
  creditsUsedThisMonth: number;
  lastCliActivityAt: string | null;
  lastCreditsSyncedAt: string | null;
};

export type DashboardSessionStatus = "new" | "complete" | "waiting";

export type DashboardSessionItem = {
  id: string;
  title: string;
  lastMode: ModeType | null;
  lastModel: string | null;
  status: DashboardSessionStatus;
  lastActivityAt: string | null;
  creditsUsed: number;
  projectPath: string |null;
};

export type DashboardTransactionType = "usage" | "purchase" | "adjustment" | "sync";

export type DashboardTransactionItem = {
  id: string;
  type: DashboardTransactionType;
  creditsDelta: number;
  description: string | null;
  sessionId: string | null;
  createdAt: string;
};

export type DashboardResponse = {
  summary: DashboardSummary;
  sessions: DashboardSessionItem[];
  transactions: DashboardTransactionItem[];
};
