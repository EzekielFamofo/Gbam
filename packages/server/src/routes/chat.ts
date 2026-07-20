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
 * Sanitizes model messages to prevent OpenAI Responses API errors
 * caused by orphaned msg_* IDs whose rs_* reasoning items were compacted.
 */
function sanitizeModelMessages(messages: ModelMessage[]): ModelMessage[] {
    return messages.map((msg) => {
        if (msg.role === "assistant") {
            // Strip provider-specific options/IDs that attach raw OpenAI response IDs
            const { providerOptions, ...cleanMsg } = msg as Record<string, unknown>;
            return cleanMsg as ModelMessage;
        }
        return msg;
    });
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
                return c.json({ error: "Session not found"}, 400);
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

            // Convert UI messages to model messages & sanitize orphaned OpenAI IDs
            const rawModelMessages = await convertToModelMessages(nextMessages, { tools });
            const modelMessages = sanitizeModelMessages(rawModelMessages);

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
                maxOutputTokens: 8000, 
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
                        ...(completedUsage ? { usage: completedUsage }: {}),
                    };
                },
                async onFinish(event) {
                    if (event.isAborted) return;

                    if (hasPendingToolCalls(event.responseMessage)) return;

                    const completedAt = new Date();

                    await db.session.update({
                        where: { id, userId},
                        data: {
                            messages: compactConversationForSession(event.messages as unknown as GbamUIMessage[]) as unknown as Prisma.InputJsonValue,
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