import { compactConversationForSession, getToolContracts, modeSchema, type ModeType, type ToolContracts } from "@gbam/shared";
import { convertToModelMessages, InferUITools, type LanguageModelUsage, streamText, type UIMessage, safeValidateUIMessages, type ModelMessage } from "ai";
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
import { getAvailableCreditsBalance, IngestAiUsage } from "../lib/polar";
import { requireAuth } from "../middleware/require-auth";

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

/**
 * Strips provider metadata and msg_* IDs from UI messages before saving to Prisma DB.
 */
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

/**
 * Option B: Synthetic Error Completion
 * Scans all assistant tool calls and ensures every toolCallId has a matching tool response.
 * If tool calls were interrupted or left pending in history/payload, this appends a synthetic
 * tool error message to complete the lifecycle for OpenAI schema validity without losing state.
 */
function completeDanglingToolCalls(messages: ModelMessage[]): ModelMessage[] {
    const validToolCalls = new Map<string, string>(); // toolCallId -> toolName
    const respondedToolCalls = new Set<string>();

    // Step 1: Collect emitted tool call IDs and existing tool result IDs
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

    // Step 2: Find toolCallIds without a matching tool result
    const unhandledIds = Array.from(validToolCalls.keys()).filter(
        (id) => !respondedToolCalls.has(id)
    );

    // Filter out any completely empty content messages
    const cleanedMessages = messages.filter(
        (msg) => msg.content && (!Array.isArray(msg.content) || msg.content.length > 0)
    );

    if (unhandledIds.length === 0) {
        return cleanedMessages;
    }

    // Step 3: Inject synthetic error tool results for missing tool responses
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
        async (c) => {
            const userId = c.get("userId");
            const { id, messages, mode, model } = c.req.valid("json");

            const session = await db.session.findUnique({
                where: { id, userId }
            });

            if (!session) {
                return c.json({ error: "Session not found" }, 400);
            }

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

            // Convert UI messages to ModelMessages and complete any unhandled tool calls
            const rawModelMessages = await convertToModelMessages(nextMessages, { tools });
            const modelMessages = completeDanglingToolCalls(rawModelMessages);

            let completedUsage: LanguageModelUsage | null = null;

            await db.$executeRaw`
              UPDATE "Session"
              SET
                "lastMode" = ${mode},
                "lastModel" = ${model},
                "lastActivityAt" = ${summaryStartTime},
                "status" = ${"waiting"},
                "updatedAt" = ${summaryStartTime}
              WHERE "id" = ${id} AND "userId" = ${userId}
            `;

            const result = streamText({
                model: resolvedModel.model,
                system: buildSystemPrompt({ mode }),
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

                    if (hasPendingToolCalls(event.responseMessage)) return;

                    const completedAt = new Date();

                    // Strip any provider metadata from event.messages before storing in Postgres
                    const sanitizedMessages = sanitizeUIMessagesForStorage(
                        event.messages as unknown as GbamUIMessage[]
                    );

                    await db.session.update({
                        where: { id, userId },
                        data: {
                            messages: compactConversationForSession(sanitizedMessages) as unknown as Prisma.InputJsonValue,
                        },
                    });

                    await db.$executeRaw`
                      UPDATE "Session"
                      SET
                        "lastMode" = ${mode},
                        "lastModel" = ${model},
                        "lastActivityAt" = ${completedAt},
                        "status" = ${"complete"},
                        "updatedAt" = ${completedAt}
                      WHERE "id" = ${id} AND "userId" = ${userId}
                    `;

                    if (!completedUsage) return;

                    try {
                        const billableUsage = CalculateCreditsForUsage({
                            provider: resolvedModel.provider,
                            model: resolvedModel.modelId,
                            usage: completedUsage,
                        });

                        const providerReference = `chat-message:${event.responseMessage.id}`;

                        await IngestAiUsage({
                            externalCustomerId: userId,
                            eventId: providerReference,
                            credits: billableUsage.credits
                        });

                        let providerBalanceCreditsAfter: number | null = null;
                        try {
                            providerBalanceCreditsAfter = await getAvailableCreditsBalance(userId);
                        } catch (balanceError) {
                            console.error("Failed to refresh provider balance after usage ingest", {
                                balanceError,
                                sessionId: id,
                                messageId: event.responseMessage.id,
                                userId,
                            });
                        }

                        await recordUsageCreditTransaction({
                            userId,
                            sessionId: id,
                            messageId: event.responseMessage.id,
                            credits: billableUsage.credits,
                            description: session.title,
                            providerReference,
                            providerBalanceCreditsAfter,
                        });

                        await db.$executeRaw`
                          UPDATE "Session"
                          SET
                            "creditsUsed" = COALESCE("creditsUsed", 0) + ${billableUsage.credits},
                            "updatedAt" = ${completedAt}
                          WHERE "id" = ${id} AND "userId" = ${userId}
                        `;
                    } catch (error) {
                        console.error("Failed to ingest Polar AI usage for chat message", {
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