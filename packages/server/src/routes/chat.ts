import { getToolContracts, modeSchema, ModeType, ToolContracts } from "@gbam/shared"
import { convertToModelMessages, InferUITools, LanguageModelUsage, streamText, UIMessage, safeValidateUIMessages } from "ai";
import z from "zod";
import { isSupportedChatModel, resolveChatModel } from "../lib/models";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { AuthenticatedEnv } from "../middleware/require-auth";
import { requireCreditsBalance } from "../middleware/require-credits-balance";
import { db } from "@gbam/database/client";
import { buildSystemPrompt } from "../system-prompt";
import { Prisma } from "../../../database/generated/prisma/client";
import { CalculateCreditsForUsage } from "../lib/credits";
import { IngestAiUsage } from "../lib/polar";

type ChatMessageMetadata = {
    mode?: ModeType;
    model?: string;
    durationMs?: number;
    usage?: LanguageModelUsage;
};

type gbamUIMessage = UIMessage<ChatMessageMetadata, never, InferUITools<ToolContracts>>;

const submitSchema = z.object({
    id: z.string(),
    messages: z.array(
        z.custom<gbamUIMessage>((value) => {
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

function hasPendingToolCalls(message: gbamUIMessage) {
    return message.parts.some((part) => {
        if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
            const state = (part as { state?: string }).state;
            return state !== "output-available" && state !== "output-error"
        }

        return false;
    });
};


const app = new Hono<AuthenticatedEnv>()
    .post(
        "/",
        requireCreditsBalance,
        submitValidator,
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
            const tools = getToolContracts(mode);
            const resolvedModel = resolveChatModel(model);
            const prreviousMessages = Array.isArray(session.messages)
                ? (session.messages as unknown as gbamUIMessage[])
                : [];
            const mergedMessages =  [...prreviousMessages];

            for (const message of messages) {
                const incomingMessage = {
                    ...message,
                    metadata: { ...message.metadata, mode, model },
                } satisfies gbamUIMessage;

                const existingMessageIndex = mergedMessages.findIndex((m) => m.id === incomingMessage.id)

                if (existingMessageIndex === -1) {
                    mergedMessages.push(incomingMessage);
                } else {
                    mergedMessages[existingMessageIndex] = incomingMessage;
                }
            }

            // 1. Clean history to remove empty messages (Zod requires messages to have min 1 part)
            const cleanMergedMessages = mergedMessages.filter((m) => m.parts && m.parts.length > 0);

            // 2. Safely validate the messages using safeValidateUIMessages
            const validationResult = await safeValidateUIMessages<gbamUIMessage>({
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

            const modelMessages = await convertToModelMessages(nextMessages, { tools });
            let completedUsage: LanguageModelUsage | null = null;

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

            return result.toUIMessageStreamResponse<gbamUIMessage>({
                originalMessages: nextMessages,
                messageMetadata({ part }) {
                    if (part.type === "start") {
                        return {mode, model};
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

                    await db.session.update({
                        where: { id, userId},
                        data: {
                            messages: event.messages as unknown as Prisma.InputJsonValue,
                        },
                    });

                    if (!completedUsage) return;

                    try {
                        const billableUsage = CalculateCreditsForUsage({
                            provider: resolvedModel.provider,
                            model: resolvedModel.modelId,
                            usage: completedUsage,
                        });

                        await IngestAiUsage({
                            externalCustomerId: userId,
                            eventId: `chat-message:${event.responseMessage.id}`,
                            credits: billableUsage.credits
                        });
                    } catch (error) {
                        console.error("Faiiled to ingest Polar AI usage for chat message", {
                            error,
                            sessionId: id,
                            messageId: event.responseMessage.id,
                            userId,
                        });
                    }
                },
                onError(error) {
                    return error instanceof Error ? error.message : String(error)
                },
            });
        },
    );

export default app;