export type ModelPricing = {
    inputNgNPerMillionTokens: number;
    outputNgNPerMillionTokens: number;
};

export type SupportedProvider = "google" | "openai";

type SupportedChatModelDefinition = {
    id: string;
    provider: SupportedProvider;
    pricing: ModelPricing;
};

export const SUPPORTED_CHAT_MODELS = [
    // Google Models
    {
        id: "gemini-3.5-flash", // $1.50 / $9.00 USD
        provider: "google",
        pricing: {
            inputNgNPerMillionTokens: 2100,   // 1.50 * 1400
            outputNgNPerMillionTokens: 12600, // 9.00 * 1400
        },
    },
    {
        id: "gemini-3-flash-preview", // $0.50 / $3.00 USD
        provider: "google",
        pricing: {
            inputNgNPerMillionTokens: 700,    // 0.50 * 1400
            outputNgNPerMillionTokens: 4200,  // 3.00 * 1400
        },
    },
    {
        id: "gemini-3.1-flash-lite", // $0.25 / $1.50 USD
        provider: "google",
        pricing: {
            inputNgNPerMillionTokens: 350,    // 0.25 * 1400
            outputNgNPerMillionTokens: 2100,  // 1.50 * 1400
        },
    },
    // OpenAI Models
    {
        id: "gpt-4o", // $2.50 / $10.00 USD — unchanged
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 3500,
            outputNgNPerMillionTokens: 14000,
        },
    },
    {
        id: "gpt-4.1", // $2.00 / $8.00 USD — unchanged
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 2800,
            outputNgNPerMillionTokens: 11200,
        },
    },
    {
        id: "gpt-5.4", // $2.50 / $15.00 USD
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 3500,   // 2.50 * 1400
            outputNgNPerMillionTokens: 21000, // 15.00 * 1400
        },
    },
    {
        id: "gpt-5-codex", // $1.25 / $10.00 USD
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 1750,   // 1.25 * 1400
            outputNgNPerMillionTokens: 14000, // 10.00 * 1400
        },
    },
] as const satisfies readonly SupportedChatModelDefinition[];

export type SupportedChatModel = (typeof SUPPORTED_CHAT_MODELS)[number];
export type SupportedChatModelId = SupportedChatModel["id"];

export function findSupportedChatModel(modelId: string) {
    return SUPPORTED_CHAT_MODELS.find((model) => model.id === modelId);
}

export const DEFAULT_CHAT_MODEL_ID: SupportedChatModelId = "gpt-5.4";