export type ModelPricing = {
    inputUsdPerMillionTokens: number;
    outputUsdPerMillionTokens: number;
};

// 1. Updated the provider type to focus on the active platforms
export type SupportedProvider = "google" | "qwen" | "poolside";

type SupportedChatModelDefinition = {
    id: string;
    provider: SupportedProvider;
    pricing: ModelPricing;
};

export const SUPPORTED_CHAT_MODELS = [
    {
        id: "gemini-3.5-flash",
        provider: "google",
        pricing: {
            inputUsdPerMillionTokens: 0.15,
            outputUsdPerMillionTokens: 0.60,
        },
    },
    {
        id: "gemini-3-flash-preview",
        provider: "google",
        pricing: {
            inputUsdPerMillionTokens: 0.50,
            outputUsdPerMillionTokens: 3.00,
        },
    },
    {
        id: "gemini-3.1-flash-lite",
        provider: "google",
        pricing: {
            inputUsdPerMillionTokens: 0.25,
            outputUsdPerMillionTokens: 1.50,
        },
    },
    {
        id: "qwen/qwen3-coder:free",
        provider: "qwen",
        pricing: {
            inputUsdPerMillionTokens: 1, 
            outputUsdPerMillionTokens: 2,
        },
    },
    {
        id: "poolside/laguna-m.1:free",
        provider: "poolside",
        pricing: {
            inputUsdPerMillionTokens: 1,
            outputUsdPerMillionTokens: 2,
        },
    },
] as const satisfies readonly SupportedChatModelDefinition[];

export type SupportedChatModel = (typeof SUPPORTED_CHAT_MODELS)[number];
export type SupportedChatModelId = SupportedChatModel["id"];

export function findSupportedChatModel(modelId: string) {
    return SUPPORTED_CHAT_MODELS.find((model) => model.id === modelId);
}

export const DEFAULT_CHAT_MODEL_ID: SupportedChatModelId = "poolside/laguna-m.1:free";