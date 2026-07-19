import { google } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { ProviderOptions } from "@ai-sdk/provider-utils"

import {
    findSupportedChatModel,
    type SupportedChatModel,
    type SupportedChatModelId,
    type SupportedProvider
} from "@gbam/shared";

import type { LanguageModel } from 'ai';

// Extract precise model ID subsections based on the current platform definitions.
type GeminiModelId = Extract<SupportedChatModel, {provider: "google"}>["id"];
type OpenAIModelId = Extract<SupportedChatModel, {provider: "openai"}>["id"];

export type ResolvedModel = {
    model: LanguageModel;
    provider: SupportedProvider;
    modelId: SupportedChatModelId;
    providerOptions?: ProviderOptions;
};

export const MODEL_PROVIDER_OPTIONS: Partial<Record<SupportedChatModelId, ProviderOptions>> = {
    "gemini-3.5-flash": {
        google: {
            thinkingConfig: {
                thinkingBudget: 0,
                includeThoughts: true,
            }
        }
    },
    "gemini-3-flash-preview": {
        google: {
            thinkingConfig: {
                thinkingLevel: "minimal",
                includeThoughts: true,
            }
        }
    },
    "gemini-3.1-flash-lite": {
        google: {
            thinkingConfig: {
                thinkingLevel: "minimal",
                includeThoughts: true,
            }
        }
    },
    // OpenAI models
    "gpt-4o": {},
    "gpt-4.1": {
        openai: {
            reasoningEffort: "medium",
        }
    },
    "gpt-5-codex": {
        openai: {
            reasoningEffort: "high",
        }
    },
    "gpt-5.4": {
        openai: {
            reasoningEffort: "high",
        }
    },
};

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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
        providerOptions: MODEL_PROVIDER_OPTIONS[modelId],
    };
}

function resolveOpenAIModel(modelId: OpenAIModelId): ResolvedModel {
    return {
        model: openai(modelId),
        provider: "openai",
        modelId,
        providerOptions: MODEL_PROVIDER_OPTIONS[modelId],
    };
}

export function resolveModel(model: SupportedChatModel): ResolvedModel {
    const provider = model.provider;
    if (!provider) throw new Error(`Model not found: ${model}`);

    // Map the active configuration provider targets directly to their respective values
    switch (provider) {
        case "google":
            return resolveGeminiModel(model.id as GeminiModelId);
        case "openai":
            return resolveOpenAIModel(model.id as OpenAIModelId);
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