import { db } from "@gbam/database/client";
import {
  findSupportedChatModel,
  type DashboardResponse,
  type DashboardSessionItem,
  type DashboardSessionStatus,
  type DashboardTransactionItem,
  type ModeType,
} from "@gbam/shared";
import type { LanguageModelUsage } from "ai";
import { CalculateCreditsForUsage } from "./credits";
import { getAvailableCreditsBalance } from "./polar";

type StoredMessageMetadata = {
  mode?: ModeType;
  model?: string;
  usage?: LanguageModelUsage;
};

type StoredMessage = {
  id?: string;
  role?: string;
  metadata?: StoredMessageMetadata;
};

type SessionRecord = {
  id: string;
  title: string;
  updatedAt: Date;
  messages: unknown;
};

function parseMessages(messages: unknown): StoredMessage[] {
  return Array.isArray(messages) ? (messages as StoredMessage[]) : [];
}

function getLastMetadata(messages: StoredMessage[]) {
  for (let index = messages.length - 1; index >= 0; index--) {
    const metadata = messages[index]?.metadata;
    if (metadata?.mode || metadata?.model) {
      return {
        lastMode: metadata.mode ?? null,
        lastModel: metadata.model ?? null,
      };
    }
  }

  return {
    lastMode: null,
    lastModel: null,
  };
}

function getSessionStatus(messages: StoredMessage[]): DashboardSessionStatus {
  if (messages.length === 0) {
    return "new";
  }

  return messages[messages.length - 1]?.role === "assistant" ? "complete" : "waiting";
}

function getUsageCredits(message: StoredMessage): number {
  if (message.role !== "assistant") {
    return 0;
  }

  const modelId = message.metadata?.model;
  const usage = message.metadata?.usage;
  if (!modelId || !usage) {
    return 0;
  }

  const supportedModel = findSupportedChatModel(modelId);
  if (!supportedModel) {
    return 0;
  }

  try {
    return CalculateCreditsForUsage({
      provider: supportedModel.provider,
      model: supportedModel.id,
      usage,
    }).credits;
  } catch {
    return 0;
  }
}

function summarizeSession(session: SessionRecord): DashboardSessionItem {
  const messages = parseMessages(session.messages);
  const { lastMode, lastModel } = getLastMetadata(messages);
  const creditsUsed = messages.reduce((total, message) => total + getUsageCredits(message), 0);

  return {
    id: session.id,
    title: session.title,
    lastMode,
    lastModel,
    status: getSessionStatus(messages),
    lastActivityAt: session.updatedAt.toISOString(),
    creditsUsed,
  };
}

export async function getDashboardData(userId: string): Promise<DashboardResponse> {
  const sessions = await db.session.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      updatedAt: true,
      messages: true,
    },
  });

  const sessionItems = sessions.map((session) => summarizeSession(session));

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const creditsUsedThisMonth = sessionItems
    .filter((session) => {
      if (!session.lastActivityAt) return false;
      return new Date(session.lastActivityAt) >= monthStart;
    })
    .reduce((total, session) => total + session.creditsUsed, 0);

  const transactions: DashboardTransactionItem[] = sessionItems
    .filter((session) => session.creditsUsed > 0 && session.lastActivityAt)
    .slice(0, 10)
    .map((session) => ({
      id: `usage:${session.id}`,
      type: "usage",
      creditsDelta: -session.creditsUsed,
      description: session.title,
      sessionId: session.id,
      createdAt: session.lastActivityAt!,
    }));

  let creditsBalance = 0;
  try {
    creditsBalance = await getAvailableCreditsBalance(userId);
  } catch (error) {
    console.error("Failed to fetch live credits balance for dashboard", { error, userId });
  }

  return {
    summary: {
      creditsBalance,
      creditsUsedThisMonth,
      lastCliActivityAt: sessionItems[0]?.lastActivityAt ?? null,
    },
    sessions: sessionItems.slice(0, 10),
    transactions,
  };
}
