export type ModelPricing = {
    inputNgNPerMillionTokens: number;
    outputNgNPerMillionTokens: number;
};

export type SupportedProvider =
    | "google"
    | "openai"
    | "anthropic"
    | "deepseek"
    | "qwen"
    | "x-ai"
    | "z-ai"
    | "moonshotai"
    | "minimax"
    | "inclusionai"
    | "sakana"
    | "tencent"
    | "stepfun"
    | "bytedance-seed"
    | "poolside";

export type CostTier = "$" | "$$" | "$$$" | "$$$$";

export type SupportedChatModelDefinition = {
    id: string;
    provider: SupportedProvider;
    pricing: ModelPricing;
    costTier: CostTier;
    supportsThinking: boolean;
};

// NGN conversion rate used throughout:
// $1 USD = ₦1,400
//
// Pricing source:
// OpenRouter current model catalog.
//
// Prices are standard input/output prices per 1M tokens.
// Promotional discounts and long-context pricing are not
// represented here.
//
// Reliability policy:
// Models/providers below ~95% observed OpenRouter uptime
// have been excluded where a suitable replacement exists.
//
// Exactly 10 unique models per tier.

export const SUPPORTED_CHAT_MODELS = [
    // ── $ — Budget / high-volume ──────────────────────────────────────
    {
        id: "deepseek/deepseek-v4-flash-0731",
        provider: "deepseek",
        pricing: {
            inputNgNPerMillionTokens: 126,
            outputNgNPerMillionTokens: 252,
        },
        costTier: "$",
        supportsThinking: true,
    },
    {
        id: "qwen/qwen3.7-flash",
        provider: "qwen",
        pricing: {
            inputNgNPerMillionTokens: 42,
            outputNgNPerMillionTokens: 182,
        },
        costTier: "$",
        supportsThinking: true,
    },
    {
        id: "google/gemini-3.5-flash-lite",
        provider: "google",
        pricing: {
            inputNgNPerMillionTokens: 420,
            outputNgNPerMillionTokens: 3500,
        },
        costTier: "$",
        supportsThinking: true,
    },
    {
        id: "qwen/qwen3-coder-next",
        provider: "qwen",
        pricing: {
            inputNgNPerMillionTokens: 154,
            outputNgNPerMillionTokens: 1120,
        },
        costTier: "$",
        supportsThinking: false,
    },
    {
        id: "stepfun/step-3.5-flash",
        provider: "stepfun",
        pricing: {
            inputNgNPerMillionTokens: 140,
            outputNgNPerMillionTokens: 420,
        },
        costTier: "$",
        supportsThinking: true,
    },
    {
        id: "openai/gpt-5-nano",
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 70,
            outputNgNPerMillionTokens: 560,
        },
        costTier: "$",
        supportsThinking: true,
    },
    {
        id: "qwen/qwen3-coder-flash",
        provider: "qwen",
        pricing: {
            inputNgNPerMillionTokens: 140,
            outputNgNPerMillionTokens: 700,
        },
        costTier: "$",
        supportsThinking: false,
    },
    {
        id: "bytedance-seed/seed-1.6-flash",
        provider: "bytedance-seed",
        pricing: {
            inputNgNPerMillionTokens: 105,
            outputNgNPerMillionTokens: 420,
        },
        costTier: "$",
        supportsThinking: true,
    },
    {
        id: "qwen/qwen3-32b",
        provider: "qwen",
        pricing: {
            inputNgNPerMillionTokens: 98,
            outputNgNPerMillionTokens: 560,
        },
        costTier: "$",
        supportsThinking: true,
    },
    {
        id: "poolside/laguna-s-2.1",
        provider: "poolside",
        pricing: {
            inputNgNPerMillionTokens: 126,
            outputNgNPerMillionTokens: 252,
        },
        costTier: "$",
        supportsThinking: true,
    },

    // ── $$ — Balanced ─────────────────────────────────────────────────
    {
        id: "qwen/qwen3.5-122b-a10b",
        provider: "qwen",
        pricing: {
            inputNgNPerMillionTokens: 364,
            outputNgNPerMillionTokens: 2912,
        },
        costTier: "$$",
        supportsThinking: true,
    },
    {
        id: "qwen/qwen3.5-plus-20260420",
        provider: "qwen",
        pricing: {
            inputNgNPerMillionTokens: 420,
            outputNgNPerMillionTokens: 2520,
        },
        costTier: "$$",
        supportsThinking: true,
    },
    {
        id: "qwen/qwen3.6-flash",
        provider: "qwen",
        pricing: {
            inputNgNPerMillionTokens: 350,
            outputNgNPerMillionTokens: 2100,
        },
        costTier: "$$",
        supportsThinking: true,
    },
    {
        id: "qwen/qwen3-coder-plus",
        provider: "qwen",
        pricing: {
            inputNgNPerMillionTokens: 910,
            outputNgNPerMillionTokens: 4550,
        },
        costTier: "$$",
        supportsThinking: false,
    },
    {
        id: "openai/gpt-5-codex",
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 1750,
            outputNgNPerMillionTokens: 14000,
        },
        costTier: "$$",
        supportsThinking: true,
    },
    {
        id: "openai/gpt-5.2-codex",
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 2450,
            outputNgNPerMillionTokens: 19600,
        },
        costTier: "$$",
        supportsThinking: true,
    },
    {
        id: "openai/gpt-5-chat",
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 1750,
            outputNgNPerMillionTokens: 14000,
        },
        costTier: "$$",
        supportsThinking: true,
    },
    {
        id: "google/gemini-3-flash-preview",
        provider: "google",
        pricing: {
            inputNgNPerMillionTokens: 980,
            outputNgNPerMillionTokens: 4200,
        },
        costTier: "$$",
        supportsThinking: true,
    },
    {
        id: "google/gemini-3.5-flash",
        provider: "google",
        pricing: {
            inputNgNPerMillionTokens: 2100,
            outputNgNPerMillionTokens: 12600,
        },
        costTier: "$$",
        supportsThinking: true,
    },
    {
        id: "openai/o4-mini",
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 1540,
            outputNgNPerMillionTokens: 6160,
        },
        costTier: "$$",
        supportsThinking: true,
    },

    // ── $$$ — Premium ─────────────────────────────────────────────────
    {
        id: "openai/gpt-5.4",
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 3500,
            outputNgNPerMillionTokens: 21000,
        },
        costTier: "$$$",
        supportsThinking: true,
    },
    {
        id: "anthropic/claude-sonnet-4.6",
        provider: "anthropic",
        pricing: {
            inputNgNPerMillionTokens: 4200,
            outputNgNPerMillionTokens: 21000,
        },
        costTier: "$$$",
        supportsThinking: true,
    },
    {
        id: "anthropic/claude-sonnet-5",
        provider: "anthropic",
        pricing: {
            inputNgNPerMillionTokens: 2800,
            outputNgNPerMillionTokens: 14000,
        },
        costTier: "$$$",
        supportsThinking: true,
    },
    {
        id: "google/gemini-3.1-pro-preview",
        provider: "google",
        pricing: {
            inputNgNPerMillionTokens: 2800,
            outputNgNPerMillionTokens: 16800,
        },
        costTier: "$$$",
        supportsThinking: true,
    },
    {
        id: "google/gemini-3.6-flash",
        provider: "google",
        pricing: {
            inputNgNPerMillionTokens: 2100,
            outputNgNPerMillionTokens: 10500,
        },
        costTier: "$$$",
        supportsThinking: true,
    },
    {
        id: "openai/gpt-5.2",
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 2450,
            outputNgNPerMillionTokens: 19600,
        },
        costTier: "$$$",
        supportsThinking: true,
    },
    {
        id: "openai/gpt-5.3-chat",
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 2450,
            outputNgNPerMillionTokens: 19600,
        },
        costTier: "$$$",
        supportsThinking: true,
    },
    {
        id: "qwen/qwen3.5-plus-20260216",
        provider: "qwen",
        pricing: {
            inputNgNPerMillionTokens: 364,
            outputNgNPerMillionTokens: 2184,
        },
        costTier: "$$$",
        supportsThinking: true,
    },
    {
        id: "openai/o3",
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 2800,
            outputNgNPerMillionTokens: 11200,
        },
        costTier: "$$$",
        supportsThinking: true,
    },
    {
        id: "qwen/qwen3-max",
        provider: "qwen",
        pricing: {
            inputNgNPerMillionTokens: 1092,
            outputNgNPerMillionTokens: 5460,
        },
        costTier: "$$$",
        supportsThinking: false,
    },

    // ── $$$$ — Frontier ───────────────────────────────────────────────
    {
        id: "anthropic/claude-opus-5",
        provider: "anthropic",
        pricing: {
            inputNgNPerMillionTokens: 7000,
            outputNgNPerMillionTokens: 35000,
        },
        costTier: "$$$$",
        supportsThinking: true,
    },
    {
        id: "anthropic/claude-opus-5-fast",
        provider: "anthropic",
        pricing: {
            inputNgNPerMillionTokens: 14000,
            outputNgNPerMillionTokens: 70000,
        },
        costTier: "$$$$",
        supportsThinking: true,
    },
    {
        id: "anthropic/claude-opus-4.7",
        provider: "anthropic",
        pricing: {
            inputNgNPerMillionTokens: 7000,
            outputNgNPerMillionTokens: 35000,
        },
        costTier: "$$$$",
        supportsThinking: true,
    },
    {
        id: "anthropic/claude-opus-4.6",
        provider: "anthropic",
        pricing: {
            inputNgNPerMillionTokens: 7000,
            outputNgNPerMillionTokens: 35000,
        },
        costTier: "$$$$",
        supportsThinking: true,
    },
    {
        id: "anthropic/claude-opus-4.5",
        provider: "anthropic",
        pricing: {
            inputNgNPerMillionTokens: 7000,
            outputNgNPerMillionTokens: 35000,
        },
        costTier: "$$$$",
        supportsThinking: true,
    },
    {
        id: "anthropic/claude-opus-4.7-fast",
        provider: "anthropic",
        pricing: {
            inputNgNPerMillionTokens: 42000,
            outputNgNPerMillionTokens: 210000,
        },
        costTier: "$$$$",
        supportsThinking: true,
    },
    {
        id: "openai/gpt-5.5-pro",
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 42000,
            outputNgNPerMillionTokens: 252000,
        },
        costTier: "$$$$",
        supportsThinking: true,
    },
    {
        id: "openai/gpt-5.5",
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 7000,
            outputNgNPerMillionTokens: 42000,
        },
        costTier: "$$$$",
        supportsThinking: true,
    },
    {
        id: "openai/gpt-5-pro",
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 21000,
            outputNgNPerMillionTokens: 168000,
        },
        costTier: "$$$$",
        supportsThinking: true,
    },
    {
        id: "openai/o3-pro",
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 28000,
            outputNgNPerMillionTokens: 112000,
        },
        costTier: "$$$$",
        supportsThinking: true,
    },
] as const satisfies readonly SupportedChatModelDefinition[];

export type SupportedChatModel =
    (typeof SUPPORTED_CHAT_MODELS)[number];

export type SupportedChatModelId =
    SupportedChatModel["id"];

export function findSupportedChatModel(
    modelId: string
): SupportedChatModel | undefined {
    return SUPPORTED_CHAT_MODELS.find(
        (model) => model.id === modelId
    );
}

export const DEFAULT_CHAT_MODEL_ID: SupportedChatModelId =
    "google/gemini-3.5-flash";