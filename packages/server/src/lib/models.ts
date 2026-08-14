import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { ProviderOptions } from "@ai-sdk/provider-utils";
import type { LanguageModel } from "ai";

import {
    findSupportedChatModel,
    type SupportedChatModel,
    type SupportedChatModelId,
    type SupportedProvider,
} from "@gbam/shared";

export type ResolvedModel = {
    model: LanguageModel;
    provider: SupportedProvider;
    modelId: SupportedChatModelId;
    providerOptions?: ProviderOptions;
};

/**
 * Reasoning defaults are intentionally based on whether the model
 * supports thinking rather than on cost tier alone.
 *
 * OpenRouter handles provider routing/fallbacks automatically.
 */
export const MODEL_PROVIDER_OPTIONS: Partial<
    Record<SupportedChatModelId, ProviderOptions>
> = {
    // ── $ ────────────────────────────────────────────────────────────
    "deepseek/deepseek-v4-flash-0731": {
        openrouter: {
            reasoning: { effort: "minimal" },
        },
    },

    "qwen/qwen3.7-flash": {
        openrouter: {
            reasoning: { effort: "minimal" },
        },
    },

    "stepfun/step-3.5-flash": {
        openrouter: {
            reasoning: { effort: "minimal" },
        },
    },

    "openai/gpt-5-nano": {
        openrouter: {
            reasoning: { effort: "minimal" },
        },
    },

    "qwen/qwen3-coder-flash": {},

    "poolside/laguna-s-2.1": {
        openrouter: {
            reasoning: { effort: "minimal" },
        },
    },

    "inclusionai/ling-3.0-flash": {},

    "qwen/qwen3.5-flash-02-23": {},

    "bytedance-seed/seed-1.6-flash": {
        openrouter: {
            reasoning: { effort: "minimal" },
        },
    },

    "qwen/qwen3-coder-30b-a3b-instruct": {},

    // ── $$ ───────────────────────────────────────────────────────────
    "google/gemini-3.5-flash-lite": {
        openrouter: {
            reasoning: { effort: "minimal" },
        },
    },

    "qwen/qwen3.8-max": {
        openrouter: {
            reasoning: { effort: "medium" },
        },
    },

    "qwen/qwen3.7-max": {
        openrouter: {
            reasoning: { effort: "medium" },
        },
    },

    "google/gemini-3.6-flash": {
        openrouter: {
            reasoning: { effort: "medium" },
        },
    },

    "qwen/qwen3.5-122b-a10b": {},

    "qwen/qwen3.6-27b": {},

    "openai/gpt-5-mini": {
        openrouter: {
            reasoning: { effort: "medium" },
        },
    },

    "openai/gpt-5.4-mini": {
        openrouter: {
            reasoning: { effort: "medium" },
        },
    },

    "z-ai/glm-5": {
        openrouter: {
            reasoning: { effort: "medium" },
        },
    },

    "moonshotai/kimi-k2.5": {
        openrouter: {
            reasoning: { effort: "medium" },
        },
    },

    // ── $$$ ──────────────────────────────────────────────────────────
    "google/gemini-3.5-flash": {
        openrouter: {
            reasoning: { effort: "high" },
        },
    },

    "openai/gpt-5": {
        openrouter: {
            reasoning: { effort: "high" },
        },
    },

    "openai/gpt-5.2": {
        openrouter: {
            reasoning: { effort: "high" },
        },
    },

    "openai/gpt-5.3": {
        openrouter: {
            reasoning: { effort: "high" },
        },
    },

    "openai/gpt-5.4": {
        openrouter: {
            reasoning: { effort: "high" },
        },
    },

    "anthropic/claude-sonnet-4.5": {
        openrouter: {
            reasoning: { effort: "high" },
        },
    },

    "anthropic/claude-sonnet-4.6": {
        openrouter: {
            reasoning: { effort: "high" },
        },
    },

    "google/gemini-3.1-pro-preview": {
        openrouter: {
            reasoning: { effort: "high" },
        },
    },

    "moonshotai/kimi-k3": {
        openrouter: {
            reasoning: { effort: "high" },
        },
    },

    "minimax/minimax-01": {},

    // ── $$$$ ─────────────────────────────────────────────────────────
    "anthropic/claude-opus-4.6": {
        openrouter: {
            reasoning: { effort: "high" },
        },
    },

    "anthropic/claude-opus-4.7": {
        openrouter: {
            reasoning: { effort: "high" },
        },
    },

    "anthropic/claude-opus-4.8": {
        openrouter: {
            reasoning: { effort: "high" },
        },
    },

    "anthropic/claude-opus-5": {
        openrouter: {
            reasoning: { effort: "high" },
        },
    },

    "anthropic/claude-opus-5-fast": {
        openrouter: {
            reasoning: { effort: "high" },
        },
    },

    "anthropic/claude-opus-4.8-fast": {
        openrouter: {
            reasoning: { effort: "high" },
        },
    },

    "anthropic/claude-opus-4.7-fast": {
        openrouter: {
            reasoning: { effort: "high" },
        },
    },

    "openai/gpt-5.5": {
        openrouter: {
            reasoning: { effort: "high" },
        },
    },

    "openai/gpt-5.5-pro": {
        openrouter: {
            reasoning: { effort: "high" },
        },
    },

    "openai/gpt-5.4-pro": {
        openrouter: {
            reasoning: { effort: "high" },
        },
    },
};

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

export function resolveModel(
    model: SupportedChatModel,
): ResolvedModel {
    const slug = model.id;

    return {
        model: openrouter(slug),
        provider: model.provider,
        modelId: model.id,
        providerOptions: MODEL_PROVIDER_OPTIONS[model.id],
    };
}

export function isSupportedChatModel(
    modelId: string,
): modelId is SupportedChatModelId {
    return findSupportedChatModel(modelId) != null;
}

export function resolveChatModel(
    modelId: string,
): ResolvedModel {
    const model = findSupportedChatModel(modelId);

    if (!model) {
        throw new Error(`Unsupported model ID: ${modelId}`);
    }

    return resolveModel(model);
}