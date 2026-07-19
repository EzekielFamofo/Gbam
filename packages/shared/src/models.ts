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
        id: "gemini-3.5-flash", // Base tier pricing (~$0.15 / $0.60 USD)
        provider: "google",
        pricing: {
            inputNgNPerMillionTokens: 210,   // 0.15 * 1400
            outputNgNPerMillionTokens: 840,  // 0.60 * 1400
        },
    },
    {
        id: "gemini-3-flash-preview", // Premium preview pricing (~$0.50 / $2.00 USD)
        provider: "google",
        pricing: {
            inputNgNPerMillionTokens: 700,   // 0.50 * 1400
            outputNgNPerMillionTokens: 2800, // 2.00 * 1400
        },
    },
    {
        id: "gemini-3.1-flash-lite", // Economy tier (~$0.05 / $0.20 USD)
        provider: "google",
        pricing: {
            inputNgNPerMillionTokens: 70,    // 0.05 * 1400
            outputNgNPerMillionTokens: 280,  // 0.20 * 1400
        },
    },
    // OpenAI Models
    {
        id: "gpt-4o", // Standard flagship (~$2.50 / $10.00 USD)
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 3500,  // 2.50 * 1400
            outputNgNPerMillionTokens: 14000, // 10.00 * 1400
        },
    },
    {
        id: "gpt-4.1", // Flagship (~$2.00 / $8.00 USD)
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 2800,   // 2.00 * 1400
            outputNgNPerMillionTokens: 11200, // 8.00 * 1400
        },
    },
    {
        id: "gpt-5.4", // Reasoning/High-intelligence (~$15.00 / $60.00 USD)
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 21000, // 15.00 * 1400
            outputNgNPerMillionTokens: 84000, // 60.00 * 1400
        },
    },
    {
        id: "gpt-5-codex", // Reasoning/High-intelligence (~$15.00 / $60.00 USD)
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 21000, // 15.00 * 1400
            outputNgNPerMillionTokens: 84000, // 60.00 * 1400
        },
    },
] as const satisfies readonly SupportedChatModelDefinition[];

export type SupportedChatModel = (typeof SUPPORTED_CHAT_MODELS)[number];
export type SupportedChatModelId = SupportedChatModel["id"];

export function findSupportedChatModel(modelId: string) {
    return SUPPORTED_CHAT_MODELS.find((model) => model.id === modelId);
}

export const DEFAULT_CHAT_MODEL_ID: SupportedChatModelId = "gpt-5.4";