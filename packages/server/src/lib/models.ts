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

const OPENROUTER_MODEL_SLUGS: Record<SupportedChatModelId, string> = {
    // ── $ — Budget / high-volume ──────────────────────────────────────
    "deepseek/deepseek-v4-flash-0731": "deepseek/deepseek-v4-flash-0731",
    "qwen/qwen3.7-flash": "qwen/qwen3.7-flash",
    "google/gemini-3.5-flash-lite": "google/gemini-3.5-flash-lite",
    "qwen/qwen3-coder-next": "qwen/qwen3-coder-next",
    "stepfun/step-3.5-flash": "stepfun/step-3.5-flash",
    "openai/gpt-5-nano": "openai/gpt-5-nano",
    "qwen/qwen3-coder-flash": "qwen/qwen3-coder-flash",
    "bytedance-seed/seed-1.6-flash": "bytedance-seed/seed-1.6-flash",
    "qwen/qwen3-32b": "qwen/qwen3-32b",
    "poolside/laguna-s-2.1": "poolside/laguna-s-2.1",

    // ── $$ — Balanced ─────────────────────────────────────────────────
    "qwen/qwen3.5-122b-a10b": "qwen/qwen3.5-122b-a10b",
    "qwen/qwen3.5-plus-20260420": "qwen/qwen3.5-plus-20260420",
    "qwen/qwen3.6-flash": "qwen/qwen3.6-flash",
    "qwen/qwen3-coder-plus": "qwen/qwen3-coder-plus",
    "openai/gpt-5-codex": "openai/gpt-5-codex",
    "openai/gpt-5.2-codex": "openai/gpt-5.2-codex",
    "openai/gpt-5-chat": "openai/gpt-5-chat",
    "google/gemini-3-flash-preview": "google/gemini-3-flash-preview",
    "google/gemini-3.5-flash": "google/gemini-3.5-flash",
    "openai/o4-mini": "openai/o4-mini",

    // ── $$$ — Premium ─────────────────────────────────────────────────
    "openai/gpt-5.4": "openai/gpt-5.4",
    "anthropic/claude-sonnet-4.6": "anthropic/claude-sonnet-4.6",
    "anthropic/claude-sonnet-5": "anthropic/claude-sonnet-5",
    "google/gemini-3.1-pro-preview": "google/gemini-3.1-pro-preview",
    "google/gemini-3.6-flash": "google/gemini-3.6-flash",
    "openai/gpt-5.2": "openai/gpt-5.2",
    "openai/gpt-5.3-chat": "openai/gpt-5.3-chat",
    "qwen/qwen3.5-plus-20260216": "qwen/qwen3.5-plus-20260216",
    "openai/o3": "openai/o3",
    "qwen/qwen3-max": "qwen/qwen3-max",

    // ── $$$$ — Frontier ───────────────────────────────────────────────
    "anthropic/claude-opus-5": "anthropic/claude-opus-5",
    "anthropic/claude-opus-5-fast": "anthropic/claude-opus-5-fast",
    "anthropic/claude-opus-4.7": "anthropic/claude-opus-4.7",
    "anthropic/claude-opus-4.6": "anthropic/claude-opus-4.6",
    "anthropic/claude-opus-4.5": "anthropic/claude-opus-4.5",
    "anthropic/claude-opus-4.7-fast": "anthropic/claude-opus-4.7-fast",
    "openai/gpt-5.5-pro": "openai/gpt-5.5-pro",
    "openai/gpt-5.5": "openai/gpt-5.5",
    "openai/gpt-5-pro": "openai/gpt-5-pro",
    "openai/o3-pro": "openai/o3-pro",
};

/**
 * Reasoning effort defaults, tiered by costTier as a sensible baseline.
 */
export const MODEL_PROVIDER_OPTIONS: Partial<Record<SupportedChatModelId, ProviderOptions>> = {
    // ── $ — Budget: Minimal effort where thinking is supported ──────
    "deepseek/deepseek-v4-flash-0731": { openrouter: { reasoning: { effort: "minimal" } } },
    "qwen/qwen3.7-flash": { openrouter: { reasoning: { effort: "minimal" } } },
    "google/gemini-3.5-flash-lite": { openrouter: { reasoning: { effort: "minimal" } } },
    "qwen/qwen3-coder-next": {},
    "stepfun/step-3.5-flash": { openrouter: { reasoning: { effort: "minimal" } } },
    "openai/gpt-5-nano": { openrouter: { reasoning: { effort: "minimal" } } },
    "qwen/qwen3-coder-flash": {},
    "bytedance-seed/seed-1.6-flash": { openrouter: { reasoning: { effort: "minimal" } } },
    "qwen/qwen3-32b": { openrouter: { reasoning: { effort: "minimal" } } },
    "poolside/laguna-s-2.1": { openrouter: { reasoning: { effort: "minimal" } } },

    // ── $$ — Balanced: Medium effort ────────────────────────────────
    "qwen/qwen3.5-122b-a10b": { openrouter: { reasoning: { effort: "medium" } } },
    "qwen/qwen3.5-plus-20260420": { openrouter: { reasoning: { effort: "medium" } } },
    "qwen/qwen3.6-flash": { openrouter: { reasoning: { effort: "medium" } } },
    "qwen/qwen3-coder-plus": {},
    "openai/gpt-5-codex": { openrouter: { reasoning: { effort: "medium" } } },
    "openai/gpt-5.2-codex": { openrouter: { reasoning: { effort: "medium" } } },
    "openai/gpt-5-chat": { openrouter: { reasoning: { effort: "medium" } } },
    "google/gemini-3-flash-preview": { openrouter: { reasoning: { effort: "medium" } } },
    "google/gemini-3.5-flash": { openrouter: { reasoning: { effort: "medium" } } },
    "openai/o4-mini": { openrouter: { reasoning: { effort: "medium" } } },

    // ── $$$ — Premium: High effort ──────────────────────────────────
    "openai/gpt-5.4": { openrouter: { reasoning: { effort: "high" } } },
    "anthropic/claude-sonnet-4.6": { openrouter: { reasoning: { effort: "high" } } },
    "anthropic/claude-sonnet-5": { openrouter: { reasoning: { effort: "high" } } },
    "google/gemini-3.1-pro-preview": { openrouter: { reasoning: { effort: "high" } } },
    "google/gemini-3.6-flash": { openrouter: { reasoning: { effort: "high" } } },
    "openai/gpt-5.2": { openrouter: { reasoning: { effort: "high" } } },
    "openai/gpt-5.3-chat": { openrouter: { reasoning: { effort: "high" } } },
    "qwen/qwen3.5-plus-20260216": { openrouter: { reasoning: { effort: "high" } } },
    "openai/o3": { openrouter: { reasoning: { effort: "high" } } },
    "qwen/qwen3-max": {},

    // ── $$$$ — Frontier: High effort ────────────────────────────────
    "anthropic/claude-opus-5": { openrouter: { reasoning: { effort: "high" } } },
    "anthropic/claude-opus-5-fast": { openrouter: { reasoning: { effort: "high" } } },
    "anthropic/claude-opus-4.7": { openrouter: { reasoning: { effort: "high" } } },
    "anthropic/claude-opus-4.6": { openrouter: { reasoning: { effort: "high" } } },
    "anthropic/claude-opus-4.5": { openrouter: { reasoning: { effort: "high" } } },
    "anthropic/claude-opus-4.7-fast": { openrouter: { reasoning: { effort: "high" } } },
    "openai/gpt-5.5-pro": { openrouter: { reasoning: { effort: "high" } } },
    "openai/gpt-5.5": { openrouter: { reasoning: { effort: "high" } } },
    "openai/gpt-5-pro": { openrouter: { reasoning: { effort: "high" } } },
    "openai/o3-pro": { openrouter: { reasoning: { effort: "high" } } },
};

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

export function resolveModel(model: SupportedChatModel): ResolvedModel {
    const slug = OPENROUTER_MODEL_SLUGS[model.id];
    if (!slug) {
        throw new Error(`No OpenRouter slug mapped for model: ${model.id}`);
    }

    return {
        model: openrouter(slug),
        provider: model.provider,
        modelId: model.id,
        providerOptions: MODEL_PROVIDER_OPTIONS[model.id],
    };
}

export function isSupportedChatModel(modelId: string): modelId is SupportedChatModelId {
    return findSupportedChatModel(modelId) != null;
}

export function resolveChatModel(modelId: string): ResolvedModel {
    const model = findSupportedChatModel(modelId);
    if (!model) {
        throw new Error(`Unsupported model ID: ${modelId}`);
    }

    return resolveModel(model);
}