import { z } from "zod";

export const toolCallArgschema = z.record(z.string(), z.unknown());

export const messagePartSchema = z.discriminatedUnion("type", [
    z.object({// to determine and respond to what type of message the LLM is streaming back to the user
        type: z.literal("reasoning"),
        text: z.string(),
    }),
    z.object({
        type: z.literal("tool-call"),
        id: z.string(),
        name: z.string(),
        args: toolCallArgschema,
        result: z.string().optional(),
    }),
    z.object({
        type: z.literal("text"),
        text: z.string(),
    }),
]);

export const messagePartsSchema = z.array(messagePartSchema)

export type MessagePart = z.infer<typeof messagePartSchema>;

export const chatStreamEventSchema = z.discriminatedUnion("type", [// These types are whats possible to receive back from vercel Ai sdk
    z.object({
        type: z.literal("text-delta"),
        text: z.string(),
    }),
    z.object({
        type: z.literal("reasoning-delta"),
        text: z.string(),
    }),
    z.object({
        type: z.literal("tool-call"),
        toolCallId: z.string(),
        toolName: z.string(),
        args: toolCallArgschema,
    }),
    z.object({
        type: z.literal("tool-result"),
        messageId: z.string(),
        durationMs: z.number(),
    }),
    z.object({
        type: z.literal("done"),
        messageId: z.string(),
        durationMs: z.number(),
    }),
    z.object({
        type: z.literal("error"),
        message: z.string(),
    }),
]);

export type ChatStreamEvent = z.infer<typeof chatStreamEventSchema>;