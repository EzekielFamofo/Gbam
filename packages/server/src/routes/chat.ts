import {
  compactConversationForSession,
  findSupportedChatModel,
  getToolContracts,
  modeSchema,
  type ModeType,
  type ToolContracts,
} from "@gbam/shared";
import {
  convertToModelMessages,
  InferUITools,
  type LanguageModelUsage,
  streamText,
  type UIMessage,
  safeValidateUIMessages,
  type ModelMessage,
} from "ai";
import z from "zod";
import { isSupportedChatModel, resolveChatModel } from "../lib/models";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { type AuthenticatedEnv } from "../middleware/require-auth";
import { requireCreditsBalance } from "../middleware/require-credits-balance";
import { Prisma } from "@gbam/database";
import { db } from "@gbam/database/client";
import { buildSystemPrompt } from "../system-prompt"; 
import { CalculateCreditsForUsage } from "../lib/credits";
import { recordUsageCreditTransaction } from "../lib/credits-ledger";
import { requireAuth } from "../middleware/require-auth";
import { requireSpendLimit } from "../middleware/require-spend-limit";

type ChatMessageMetadata = {
  mode?: ModeType;
  model?: string;
  durationMs?: number;
  usage?: LanguageModelUsage;
};

type GbamUIMessage = UIMessage<ChatMessageMetadata, never, InferUITools<ToolContracts>>;

const submitSchema = z.object({
  id: z.string(),
  messages: z.array(
    z.custom<GbamUIMessage>((value) => {
      return value !== null && typeof value === "object" && "id" in value && "parts" in value;
    }),
  ).min(1),
  mode: modeSchema,
  model: z.string().refine(isSupportedChatModel, "Unsupported model"),
  agentsMdHash: z.string().optional(),
  agentsMdContent: z.string().optional(),
  projectPath: z.string().optional(),
});

const submitValidator = zValidator("json", submitSchema, (result, c) => {
  if (!result.success) {
    return c.json({ error: "Invalid request body" }, 400);
  }
});

function hasPendingToolCalls(message: GbamUIMessage) {
  return message.parts.some((part) => {
    if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
      const state = (part as { state?: string }).state;
      return state !== "output-available" && state !== "output-error";
    }
    return false;
  });
}

function sanitizeUIMessagesForStorage(messages: GbamUIMessage[]): GbamUIMessage[] {
  return messages.map((msg) => {
    const cleanMsg = JSON.parse(JSON.stringify(msg)) as Record<string, unknown>;

    delete cleanMsg.providerMetadata;
    delete cleanMsg.providerOptions;

    if (typeof cleanMsg.id === "string" && cleanMsg.id.startsWith("msg_")) {
      delete cleanMsg.id;
    }

    if (Array.isArray(cleanMsg.parts)) {
      cleanMsg.parts = cleanMsg.parts.map((part) => {
        if (part && typeof part === "object") {
          const cleanPart = { ...part } as Record<string, unknown>;
          delete cleanPart.providerMetadata;
          delete cleanPart.providerOptions;

          if (typeof cleanPart.id === "string" && cleanPart.id.startsWith("msg_")) {
            delete cleanPart.id;
          }
          return cleanPart;
        }
        return part;
      });
    }

    return cleanMsg as unknown as GbamUIMessage;
  });
}

function completeDanglingToolCalls(messages: ModelMessage[]): ModelMessage[] {
  const validToolCalls = new Map<string, string>();
  const respondedToolCalls = new Set<string>();

  for (const msg of messages) {
    if (msg.role === "assistant" && Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (
          typeof part === "object" &&
          part !== null &&
          "type" in part &&
          part.type === "tool-call" &&
          "toolCallId" in part
        ) {
          const call = part as { toolCallId: string; toolName?: string };
          validToolCalls.set(call.toolCallId, call.toolName || "unknown_tool");
        }
      }
    } else if (msg.role === "tool" && Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (
          typeof part === "object" &&
          part !== null &&
          "toolCallId" in part
        ) {
          respondedToolCalls.add((part as { toolCallId: string }).toolCallId);
        }
      }
    }
  }

  const unhandledIds = Array.from(validToolCalls.keys()).filter(
    (id) => !respondedToolCalls.has(id)
  );

  const cleanedMessages = messages.filter(
    (msg) => msg.content && (!Array.isArray(msg.content) || msg.content.length > 0)
  );

  if (unhandledIds.length === 0) {
    return cleanedMessages;
  }

  const syntheticToolMessage: ModelMessage = {
    role: "tool",
    content: unhandledIds.map((id) => ({
      type: "tool-result",
      toolCallId: id,
      toolName: validToolCalls.get(id) || "unknown_tool",
      result: { error: "Execution interrupted or tool execution cancelled." },
    })) as any,
  };

  return [...cleanedMessages, syntheticToolMessage];
}

const app = new Hono<AuthenticatedEnv>()
  .use("*", requireAuth)
  .post(
    "/",
    submitValidator,
    requireCreditsBalance,
    requireSpendLimit,
    async (c) => {
      const userId = c.get("userId");
      const executionId = crypto.randomUUID();
      const { id, messages, mode, model, agentsMdHash, agentsMdContent, projectPath } = c.req.valid("json");

      const session = await db.session.findUnique({
        where: { id, userId }
      });

      if (!session) {
        return c.json({ error: "Session not found" }, 400);
      }

      const resolvedProjectPath = projectPath ?? session.projectPath ?? undefined;

      // "Changed" only means something once we've seen a hash before. A
      // first-ever hash, or no hash at all (no AGENTS.md in this project),
      // isn't a "change" - the discovery directive already covers that via
      // the fresh-session case in buildSystemPrompt.
      const agentsMdChanged = Boolean(
        session.agentsMdHash && agentsMdHash && session.agentsMdHash !== agentsMdHash
      );

      // What to persist for next time: the latest hash we were sent, or
      // fall back to what was already stored if this request didn't send one.
      const nextAgentsMdHash = agentsMdHash ?? session.agentsMdHash;

      const startTime = Date.now();
      const summaryStartTime = new Date();
      const tools = getToolContracts(mode);

      const resolvedModel = resolveChatModel(model);

      const previousMessages = Array.isArray(session.messages)
        ? (session.messages as unknown as GbamUIMessage[])
        : [];
      const mergedMessages = [...previousMessages];

      for (const message of messages) {
        const incomingMessage = {
          ...message,
          metadata: { ...message.metadata, mode, model },
        } satisfies GbamUIMessage;

        const existingMessageIndex = mergedMessages.findIndex((m) => m.id === incomingMessage.id);

        if (existingMessageIndex === -1) {
          mergedMessages.push(incomingMessage);
        } else {
          mergedMessages[existingMessageIndex] = incomingMessage;
        }
      }

      const cleanMergedMessages = compactConversationForSession(
        mergedMessages.filter((m) => m.parts && m.parts.length > 0),
      );

      const validationResult = await safeValidateUIMessages<GbamUIMessage>({
        messages: cleanMergedMessages,
        tools,
      });

      if (!validationResult.success) {
        console.error("🚨 UIMessage validation failed:", JSON.stringify(validationResult.error.message));
        return c.json({ 
          error: "Invalid chat history format", 
          details: validationResult.error.message
        }, 400);
      }

      const nextMessages = validationResult.data;

      const rawModelMessages = await convertToModelMessages(nextMessages, { tools });
      const modelMessages = completeDanglingToolCalls(rawModelMessages);

      let completedUsage: LanguageModelUsage | null = null;

      await db.session.update({
        where: { id, userId },
        data: {
          lastMode: mode,
          lastModel: model,
          agentsMdHash: nextAgentsMdHash,
          projectPath: resolvedProjectPath, 
          lastActivityAt: summaryStartTime,
          status: "waiting",
          updatedAt: summaryStartTime,
        },
      });

      const result = streamText({
        model: resolvedModel.model,
        system: await buildSystemPrompt({ mode, agentsMdContent, agentsMdChanged,supportsThinking: findSupportedChatModel(resolvedModel.modelId)?.supportsThinking ?? false, }),
        messages: modelMessages,
        tools,
        providerOptions: resolvedModel.providerOptions,
        onFinish(event) {
          completedUsage = event.totalUsage;
        },
      });

      return result.toUIMessageStreamResponse<GbamUIMessage>({
        originalMessages: nextMessages,
        messageMetadata({ part }) {
          if (part.type === "start") {
            return { mode, model };
          }

          if (part.type !== "finish") return undefined;

          return {
            mode,
            model,
            durationMs: Date.now() - startTime,
            ...(completedUsage ? { usage: completedUsage } : {}),
          };
        },
        async onFinish(event) {
          if (event.isAborted) return;

          // Don't persist or mark the session complete while this request's
          // tool calls are still awaiting results - that was the missing
          // guard causing both the lost-task bug (an incomplete message
          // snapshot got saved mid-turn) and the dashboard status flicker
          // (status flipped to "complete" every intermediate round trip in
          // a multi-tool-call turn instead of only at the true end).
          if (hasPendingToolCalls(event.responseMessage)) return;

          const completedAt = new Date();

          const sanitizedMessages = sanitizeUIMessagesForStorage(
            event.messages as unknown as GbamUIMessage[]
          );

          await db.session.update({
            where: { id, userId },
            data: {
              messages: compactConversationForSession(sanitizedMessages) as unknown as Prisma.InputJsonValue,
              lastMode: mode,
              lastModel: model,
              agentsMdHash: nextAgentsMdHash,
              projectPath: resolvedProjectPath,
              lastActivityAt: completedAt,
              status: "complete",
              updatedAt: completedAt,
            },
          });

          if (!completedUsage) return;

          try {
            const billableUsage = CalculateCreditsForUsage({
              provider: resolvedModel.provider,
              model: resolvedModel.modelId,
              usage: completedUsage,
            });

            const providerReference = `chat-message:${event.responseMessage.id}-${executionId}`;

            await recordUsageCreditTransaction({
              userId,
              sessionId: id,
              messageId: event.responseMessage.id,
              credits: billableUsage.credits,
              description: session.title,
              providerReference,
            });

          } catch (error) {
            console.error("Failed to record credit usage for chat message", {
              error,
              sessionId: id,
              messageId: event.responseMessage.id,
              userId,
            });
          }
        },
        onError(error) {
          return error instanceof Error ? error.message : String(error);
        },
      });
    },
  );

export default app;