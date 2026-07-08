import { google } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

import {
    findSupportedChatModel,
    type SupportedChatModel,
    type SupportedChatModelId,
    type SupportedProvider
} from "@nightcode/shared";

import type { LanguageModel } from 'ai';

// Extract precise model ID subsections based on the current platform definitions.
type GeminiModelId = Extract<SupportedChatModel, {provider: "google"}>["id"];
type QwenModelId = Extract<SupportedChatModel, {provider: "qwen"}>["id"];
type PoolsideModelId = Extract<SupportedChatModel, {provider: "poolside"}>["id"];

export type ResolvedModel = {
    model: LanguageModel;
    provider: SupportedProvider;
    modelId: SupportedChatModelId;
};


const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

// Compile-time check to guarantee that every single enum option is exhaustively matched.
function assertUnsupportedProvider(provider: never): never {
    throw new Error(`Unsupported provider: ${provider}`);
}

function resolveGeminiModel(modelId: GeminiModelId): ResolvedModel {
    return {
        model: google(modelId),
        provider: "google",
        modelId,
    };
}

function resolveQwenModel(modelId: QwenModelId): ResolvedModel {
    return {
        model: openrouter(modelId),
        provider: "qwen",
        modelId,
    };
}

function resolvePoolsideModel(modelId: PoolsideModelId): ResolvedModel {
    return {
        model: openrouter(modelId),
        provider: "poolside",
        modelId,
    };
}

export function resolveModel(model: SupportedChatModel): ResolvedModel {
    const provider = model.provider;
    if (!provider) throw new Error(`Model not found: ${model}`);

    // Map the active configuration provider targets directly to their respective values
    switch (provider) {
        case "google":
            return resolveGeminiModel(model.id as GeminiModelId);
        case "qwen":
            return resolveQwenModel(model.id as QwenModelId);
        case "poolside":
            return resolvePoolsideModel(model.id as PoolsideModelId);
        default:
            // Fallback assertion triggers a typescript error if a newly added provider is left unhandled.
            return assertUnsupportedProvider(provider);
    }
}

export function isSupportedChatModel(modelId: string): modelId is SupportedChatModelId {
    return findSupportedChatModel(modelId) != null;
}

export function resolveChatModel(modelId: string): ResolvedModel {
    const model = findSupportedChatModel(modelId);
    if (!model) {
        throw new Error(`Unsupported model: ${modelId}`);
    }

    return resolveModel(model);
}