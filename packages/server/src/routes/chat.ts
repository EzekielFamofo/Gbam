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
  toUIMessageStream,
  createUIMessageStreamResponse,
  consumeStream,
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
import { resolveUsageForBilling } from "../lib/credits-estimation";
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

function hasPendingToolCalls(message?: GbamUIMessage) {
  if (!message || !Array.isArray(message.parts)) return false;
  return message.parts.some((part) => {
    if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
      const state = (part as { state?: string }).state;
      return state !== "output-available" && state !== "output-error";
    }
    return false;
  });
}

function markPendingToolCallsAsInterrupted<T extends GbamUIMessage>(messages: T[]): T[] {
  if (!Array.isArray(messages)) return [];

  return messages.map((msg) => {
    if (!msg || !Array.isArray(msg.parts)) return msg;

    const hasPending = msg.parts.some((part) => {
      if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
        const state = (part as { state?: string }).state;
        return state !== "output-available" && state !== "output-error";
      }
      return false;
    });

    if (!hasPending) return msg;

    return {
      ...msg,
      parts: msg.parts.map((part) => {
        if (
          part &&
          (part.type === "dynamic-tool" || part.type.startsWith("tool-")) &&
          (part as { state?: string }).state !== "output-available" &&
          (part as { state?: string }).state !== "output-error"
        ) {
          return {
            ...part,
            state: "output-error",
            errorText: "Execution interrupted before this tool call completed.",
          } as any;
        }
        return part;
      }),
    };
  });
}

/**
 * Optimized sanitization function using shallow copy & destructuring
 * instead of CPU-expensive JSON serialization (JSON.parse/stringify).
 */
function sanitizeUIMessagesForStorage(messages: GbamUIMessage[]): GbamUIMessage[] {
  if (!Array.isArray(messages)) return [];

  return messages.map((msg) => {
    const { providerMetadata, providerOptions, ...cleanMsg } = msg as any;

    if (typeof cleanMsg.id === "string" && cleanMsg.id.startsWith("msg_")) {
      delete cleanMsg.id;
    }

    if (Array.isArray(cleanMsg.parts)) {
      cleanMsg.parts = cleanMsg.parts.map((part: any) => {
        if (part && typeof part === "object") {
          const { providerMetadata: _, providerOptions: __, ...cleanPart } = part;
          if (typeof cleanPart.id === "string" && cleanPart.id.startsWith("msg_")) {
            delete cleanPart.id;
          }
          return cleanPart;
        }
        return part;
      });
    }

    return cleanMsg as GbamUIMessage;
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

      const agentsMdChanged = Boolean(
        session.agentsMdHash && agentsMdHash && session.agentsMdHash !== agentsMdHash
      );

      const nextAgentsMdHash = agentsMdHash ?? session.agentsMdHash;

      const startTime = Date.now();
      const summaryStartTime = new Date();
      const tools = getToolContracts(mode);

      const resolvedModel = resolveChatModel(model);

      // 1. Validate ONLY incoming delta messages instead of the entire historic session
      const validationResult = await safeValidateUIMessages({
        messages,
        tools: tools as any,
      });

      if (!validationResult.success) {
        console.error("🚨 UIMessage validation failed:", JSON.stringify(validationResult.error.message));
        return c.json({ 
          error: "Invalid chat history format", 
          details: validationResult.error.message
        }, 400);
      }

      const validatedIncomingMessages = validationResult.data as GbamUIMessage[];

      // 2. Merge validated incoming messages with trusted past messages from DB
      const previousMessages = Array.isArray(session.messages)
        ? (session.messages as unknown as GbamUIMessage[])
        : [];
      const mergedMessages = [...previousMessages];

      for (const message of validatedIncomingMessages) {
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

      const nextMessages = compactConversationForSession(
        mergedMessages.filter((m) => m.parts && m.parts.length > 0),
      ) as GbamUIMessage[];

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
        system: await buildSystemPrompt({
          mode,
          agentsMdContent,
          agentsMdChanged,
          supportsThinking: findSupportedChatModel(resolvedModel.modelId)?.supportsThinking ?? false,
        }),
        messages: modelMessages,
        tools,
        providerOptions: resolvedModel.providerOptions,
        abortSignal: c.req.raw.signal,
        onFinish(event) {
          completedUsage = event.usage;
        },
      });

      const messageStream = toUIMessageStream({
        stream: result.stream,
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
        onError(error) {
          return error instanceof Error ? error.message : String(error);
        },
        onEnd(event) {
          // Wrap persistence in an un-awaited background IIFE to safeguard
          // execution against HTTP request context abort drops
          (async () => {
            try {
              const completedAt = new Date();

              if (!event.isAborted) {
                if (hasPendingToolCalls(event.responseMessage as unknown as GbamUIMessage)) return;

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

                return;
              }

              // --- INTERRUPTED / ABORTED STREAM HANDLING ---
              const messagesWithInterruptedToolsMarked = markPendingToolCallsAsInterrupted(
                event.messages as unknown as GbamUIMessage[]
              );
              const sanitizedMessages = sanitizeUIMessagesForStorage(messagesWithInterruptedToolsMarked);

              await db.session.update({
                where: { id, userId },
                data: {
                  messages: compactConversationForSession(sanitizedMessages) as unknown as Prisma.InputJsonValue,
                  lastMode: mode,
                  lastModel: model,
                  agentsMdHash: nextAgentsMdHash,
                  projectPath: resolvedProjectPath,
                  lastActivityAt: completedAt,
                  status: "interrupted",
                  updatedAt: completedAt,
                },
              });

              const responseMessageParts = event.responseMessage?.parts ?? [];
              const { usage: usageForBilling, isEstimated } = resolveUsageForBilling(completedUsage, {
                modelMessages,
                responseMessageParts,
              });

              try {
                const billableUsage = CalculateCreditsForUsage({
                  provider: resolvedModel.provider,
                  model: resolvedModel.modelId,
                  usage: usageForBilling,
                });

                const responseMessageId = event.responseMessage?.id ?? crypto.randomUUID();
                const providerReference = `chat-message:${responseMessageId}-${executionId}`;

                await recordUsageCreditTransaction({
                  userId,
                  sessionId: id,
                  messageId: responseMessageId,
                  credits: billableUsage.credits,
                  description: isEstimated
                    ? `${session.title} (interrupted - estimated usage)`
                    : `${session.title} (interrupted)`,
                  providerReference,
                });
              } catch (error) {
                console.error("Failed to record credit usage for interrupted chat message", {
                  error,
                  sessionId: id,
                  messageId: event.responseMessage?.id,
                  userId,
                  isEstimated,
                });
              }
            } catch (bgError) {
              console.error("Fatal error during background stream persistence:", bgError);
            }
          })();
        },
      });

      return createUIMessageStreamResponse({
        stream: messageStream,
        consumeSseStream: consumeStream,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    },
  );

export default app;