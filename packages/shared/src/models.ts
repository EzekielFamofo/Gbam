export type ModelPricing = {
    inputUsdPerMillionTokens: number;
    outputUsdPerMillionTokens: number;
};

export type SupportedProvider = "google" | "openai";

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
    // OpenAI Models
    {
        id: "gpt-4o",
        provider: "openai",
        pricing: {
            inputUsdPerMillionTokens: 2.50,
            outputUsdPerMillionTokens: 10.00,
        },
    },
    {
        id: "gpt-4o-mini",
        provider: "openai",
        pricing: {
            inputUsdPerMillionTokens: 0.15,
            outputUsdPerMillionTokens: 0.60,
        },
    },
    {
        id: "o1",
        provider: "openai",
        pricing: {
            inputUsdPerMillionTokens: 15.00,
            outputUsdPerMillionTokens: 60.00,
        },
    },
] as const satisfies readonly SupportedChatModelDefinition[];

export type SupportedChatModel = (typeof SUPPORTED_CHAT_MODELS)[number];
export type SupportedChatModelId = SupportedChatModel["id"];

export function findSupportedChatModel(modelId: string) {
    return SUPPORTED_CHAT_MODELS.find((model) => model.id === modelId);
}

export const DEFAULT_CHAT_MODEL_ID: SupportedChatModelId = "gpt-4o-mini";