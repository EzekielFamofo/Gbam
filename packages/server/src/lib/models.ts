import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { ProviderOptions } from "@ai-sdk/provider-utils";
import type { LanguageModel } from "ai";

import {
    findSupportedChatModel,
    type SupportedChatModel,
    type SupportedChatModelId,
    type SupportedProvider,
} from "@gbam/shared";

// Extract precise model ID subsections based on active platform definitions
export type GeminiModelId = Extract<SupportedChatModel, { provider: "google" }>["id"];
export type OpenAIModelId = Extract<SupportedChatModel, { provider: "openai" }>["id"];

/**
 * Interface representing a fully resolved model ready for stream execution
 */
export type ResolvedModel = {
    model: LanguageModel;
    provider: SupportedProvider;
    modelId: SupportedChatModelId;
    providerOptions?: ProviderOptions;
};

/**
 * Model-specific provider options for Vercel AI SDK.
 * Configures Gemini thinking budgets/levels and OpenAI reasoning effort levels.
 */
export const MODEL_PROVIDER_OPTIONS: Partial<Record<SupportedChatModelId, ProviderOptions>> = {
    "gemini-3.5-flash": {
        google: {
            thinkingConfig: {
                thinkingBudget: 0,
                includeThoughts: true,
            },
        },
    },
    "gemini-3-flash-preview": {
        google: {
            thinkingConfig: {
                thinkingLevel: "minimal",
                includeThoughts: true,
            },
        },
    },
    "gemini-3.1-flash-lite": {
        google: {
            thinkingConfig: {
                thinkingLevel: "minimal",
                includeThoughts: true,
            },
        },
    },
    // OpenAI models with varying reasoning efforts
    "gpt-4o": {},
    "gpt-4.1": {
        openai: {
            reasoningEffort: "medium",
        },
    },
    "gpt-5-codex": {
        openai: {
            reasoningEffort: "high",
        },
    },
    "gpt-5.4": {
        openai: {
            reasoningEffort: "high",
        },
    },
};

// Initialize SDK client instances using environment variables
const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

/**
 * Exhaustive type assertion helper for TypeScript compile-time safety
 */
function assertUnsupportedProvider(provider: never): never {
    throw new Error(`Unsupported provider: ${provider}`);
}

/**
 * Instantiates a Gemini model using the @ai-sdk/google provider
 */
function resolveGeminiModel(modelId: GeminiModelId): ResolvedModel {
    return {
        model: google(modelId),
        provider: "google",
        modelId,
        providerOptions: MODEL_PROVIDER_OPTIONS[modelId],
    };
}

/**
 * Instantiates an OpenAI model using the @ai-sdk/openai provider
 */
function resolveOpenAIModel(modelId: OpenAIModelId): ResolvedModel {
    return {
        model: openai(modelId),
        provider: "openai",
        modelId,
        providerOptions: MODEL_PROVIDER_OPTIONS[modelId],
    };
}

/**
 * Maps a SupportedChatModel object to its concrete resolved provider instance
 */
export function resolveModel(model: SupportedChatModel): ResolvedModel {
    const provider = model.provider;
    if (!provider) throw new Error(`Model not found: ${model}`);;

    switch (provider) {
        case "google":
            return resolveGeminiModel(model.id as GeminiModelId);
        case "openai":
            return resolveOpenAIModel(model.id as OpenAIModelId);
        default:
            return assertUnsupportedProvider(provider);
    }
}

/**
 * Checks whether a given string is a valid, supported chat model ID
 */
export function isSupportedChatModel(modelId: string): modelId is SupportedChatModelId {
    return findSupportedChatModel(modelId) != null;
}

/**
 * High-level lookup: Resolves a raw model ID string into a ready-to-use ResolvedModel
 */
export function resolveChatModel(modelId: string): ResolvedModel {
    const model = findSupportedChatModel(modelId);
    if (!model) {
        throw new Error(`Unsupported model ID: ${modelId}`);
    }

    return resolveModel(model);
}