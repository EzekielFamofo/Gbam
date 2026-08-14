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
    | "moonshotai"
    | "minimax"
    | "z-ai"
    | "inclusionai"
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

/**
 * Cost tiers are determined by OUTPUT-token price.
 *
 * The boundaries are deliberately fixed and mutually exclusive:
 *
 * $      < $2.00 / 1M output tokens
 * $$     $2.00 - < $8.00
 * $$$    $8.00 - < $25.00
 * $$$$   >= $25.00
 *
 * At $1 = ₦1,400:
 *
 * $      < ₦2,800
 * $$     ₦2,800 - < ₦11,200
 * $$$    ₦11,200 - < ₦35,000
 * $$$$   >= ₦35,000
 *
 * This means cost tiers never overlap.
 */
export const COST_TIER_OUTPUT_NGN_BANDS = {
    "$": {
        minNgNPerMillionTokens: 0,
        maxNgNPerMillionTokensExclusive: 2_800,
    },
    "$$": {
        minNgNPerMillionTokens: 2_800,
        maxNgNPerMillionTokensExclusive: 11_200,
    },
    "$$$": {
        minNgNPerMillionTokens: 11_200,
        maxNgNPerMillionTokensExclusive: 35_000,
    },
    "$$$$": {
        minNgNPerMillionTokens: 35_000,
        maxNgNPerMillionTokensExclusive: null,
    },
} as const;

/**
 * Exactly 10 unique models per cost tier.
 *
 * Prices are current OpenRouter list prices converted to NGN
 * using:
 *
 * $1 USD = ₦1,400
 *
 * Cost tier is based exclusively on output price.
 */
export const SUPPORTED_CHAT_MODELS = [
    // ── $ — Output < $2 / 1M ──────────────────────────────────────────
    {
        id: "deepseek/deepseek-v4-flash-0731",
        provider: "deepseek",
        pricing: {
            inputNgNPerMillionTokens: 196,
            outputNgNPerMillionTokens: 392,
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
            inputNgNPerMillionTokens: 273,
            outputNgNPerMillionTokens: 1365,
        },
        costTier: "$",
        supportsThinking: false,
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
    {
        id: "inclusionai/ling-3.0-flash",
        provider: "inclusionai",
        pricing: {
            inputNgNPerMillionTokens: 29.4,
            outputNgNPerMillionTokens: 88.2,
        },
        costTier: "$",
        supportsThinking: false,
    },
    {
        id: "qwen/qwen3.5-flash-02-23",
        provider: "qwen",
        pricing: {
            inputNgNPerMillionTokens: 91,
            outputNgNPerMillionTokens: 364,
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
        id: "qwen/qwen3-coder-30b-a3b-instruct",
        provider: "qwen",
        pricing: {
            inputNgNPerMillionTokens: 98,
            outputNgNPerMillionTokens: 392,
        },
        costTier: "$",
        supportsThinking: false,
    },

    // ── $$ — Output $2 - < $8 / 1M ────────────────────────────────────
    {
        id: "google/gemini-3.5-flash-lite",
        provider: "google",
        pricing: {
            inputNgNPerMillionTokens: 420,
            outputNgNPerMillionTokens: 3500,
        },
        costTier: "$$",
        supportsThinking: true,
    },
    {
        id: "qwen/qwen3.8-max",
        provider: "qwen",
        pricing: {
            inputNgNPerMillionTokens: 2800,
            outputNgNPerMillionTokens: 8400,
        },
        costTier: "$$",
        supportsThinking: true,
    },
    {
        id: "qwen/qwen3.7-max",
        provider: "qwen",
        pricing: {
            inputNgNPerMillionTokens: 2065,
            outputNgNPerMillionTokens: 6195,
        },
        costTier: "$$",
        supportsThinking: true,
    },
    {
        id: "google/gemini-3.6-flash",
        provider: "google",
        pricing: {
            inputNgNPerMillionTokens: 1050,
            outputNgNPerMillionTokens: 5250,
        },
        costTier: "$$",
        supportsThinking: true,
    },
    {
        id: "qwen/qwen3.5-122b-a10b",
        provider: "qwen",
        pricing: {
            inputNgNPerMillionTokens: 406,
            outputNgNPerMillionTokens: 3360,
        },
        costTier: "$$",
        supportsThinking: false,
    },
    {
        id: "qwen/qwen3.6-27b",
        provider: "qwen",
        pricing: {
            inputNgNPerMillionTokens: 840,
            outputNgNPerMillionTokens: 5040,
        },
        costTier: "$$",
        supportsThinking: false,
    },
    {
        id: "openai/gpt-5-mini",
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 350,
            outputNgNPerMillionTokens: 2800,
        },
        costTier: "$$",
        supportsThinking: true,
    },
    {
        id: "openai/gpt-5.4-mini",
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 1050,
            outputNgNPerMillionTokens: 6300,
        },
        costTier: "$$",
        supportsThinking: true,
    },
    {
        id: "z-ai/glm-5",
        provider: "z-ai",
        pricing: {
            inputNgNPerMillionTokens: 1330,
            outputNgNPerMillionTokens: 3570,
        },
        costTier: "$$",
        supportsThinking: true,
    },
    {
        id: "moonshotai/kimi-k2.5",
        provider: "moonshotai",
        pricing: {
            inputNgNPerMillionTokens: 798,
            outputNgNPerMillionTokens: 3990,
        },
        costTier: "$$",
        supportsThinking: true,
    },

    // ── $$$ — Output $8 - < $25 / 1M ──────────────────────────────────
    {
        id: "google/gemini-3.5-flash",
        provider: "google",
        pricing: {
            inputNgNPerMillionTokens: 2100,
            outputNgNPerMillionTokens: 12600,
        },
        costTier: "$$$",
        supportsThinking: true,
    },
    {
        id: "openai/gpt-5",
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 1750,
            outputNgNPerMillionTokens: 14000,
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
        id: "openai/gpt-5.3",
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 2450,
            outputNgNPerMillionTokens: 19600,
        },
        costTier: "$$$",
        supportsThinking: true,
    },
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
        id: "anthropic/claude-sonnet-4.5",
        provider: "anthropic",
        pricing: {
            inputNgNPerMillionTokens: 4200,
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
        id: "moonshotai/kimi-k3",
        provider: "moonshotai",
        pricing: {
            inputNgNPerMillionTokens: 4200,
            outputNgNPerMillionTokens: 21000,
        },
        costTier: "$$$",
        supportsThinking: true,
    },
    {
        id: "minimax/minimax-01",
        provider: "minimax",
        pricing: {
            inputNgNPerMillionTokens: 2800,
            outputNgNPerMillionTokens: 15400,
        },
        costTier: "$$$",
        supportsThinking: false,
    },

    // ── $$$$ — Output >= $25 / 1M ────────────────────────────────────
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
        id: "anthropic/claude-opus-4.8",
        provider: "anthropic",
        pricing: {
            inputNgNPerMillionTokens: 7000,
            outputNgNPerMillionTokens: 35000,
        },
        costTier: "$$$$",
        supportsThinking: true,
    },
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
        id: "anthropic/claude-opus-4.8-fast",
        provider: "anthropic",
        pricing: {
            inputNgNPerMillionTokens: 14000,
            outputNgNPerMillionTokens: 70000,
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
        id: "openai/gpt-5.4-pro",
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 42000,
            outputNgNPerMillionTokens: 252000,
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
    modelId: string,
): SupportedChatModel | undefined {
    return SUPPORTED_CHAT_MODELS.find(
        (model) => model.id === modelId,
    );
}

export const DEFAULT_CHAT_MODEL_ID: SupportedChatModelId =
    "google/gemini-3.6-flash";