export type ModelPricing = {
    inputNgNPerMillionTokens: number;
    outputNgNPerMillionTokens: number;
};

export type SupportedProvider = "google" | "openai";
export type CostTier = "$" | "$$" | "$$$" | "$$$$";

export type SupportedChatModelDefinition = {
    id: string;
    provider: SupportedProvider;
    pricing: ModelPricing;
    costTier: CostTier;
    supportsThinking: boolean;
};

export const SUPPORTED_CHAT_MODELS = [
    // Google Models
    {
        id: "gemini-3.5-flash",
        provider: "google",
        pricing: {
            inputNgNPerMillionTokens: 2100,   // $1.50 USD
            outputNgNPerMillionTokens: 12600, // $9.00 USD
        },
        costTier: "$$",
        supportsThinking: true,
    },
    {
        id: "gemini-3-flash-preview",
        provider: "google",
        pricing: {
            inputNgNPerMillionTokens: 700,    // $0.50 USD
            outputNgNPerMillionTokens: 4200,  // $3.00 USD
        },
        costTier: "$",
        supportsThinking: true,
    },
    {
        id: "gemini-3.1-flash-lite",
        provider: "google",
        pricing: {
            inputNgNPerMillionTokens: 350,    // $0.25 USD
            outputNgNPerMillionTokens: 2100,  // $1.50 USD
        },
        costTier: "$",
        supportsThinking: false,
    },
    // OpenAI Models
    {
        id: "gpt-4o",
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 3500,  // $2.50 USD
            outputNgNPerMillionTokens: 14000, // $10.00 USD
        },
        costTier: "$$$",
        supportsThinking: false,
    },
    {
        id: "gpt-4.1",
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 2800,  // $2.00 USD
            outputNgNPerMillionTokens: 11200, // $8.00 USD
        },
        costTier: "$$",
        supportsThinking: false,
    },
    {
        id: "gpt-5.4",
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 3500,   // $2.50 USD
            outputNgNPerMillionTokens: 21000, // $15.00 USD
        },
        costTier: "$$$$",
        supportsThinking: true,
    },
    {
        id: "gpt-5-codex",
        provider: "openai",
        pricing: {
            inputNgNPerMillionTokens: 1750,   // $1.25 USD
            outputNgNPerMillionTokens: 14000, // $10.00 USD
        },
        costTier: "$$",
        supportsThinking: true,
    },
] as const satisfies readonly SupportedChatModelDefinition[];

export type SupportedChatModel = (typeof SUPPORTED_CHAT_MODELS)[number];
export type SupportedChatModelId = SupportedChatModel["id"];

export function findSupportedChatModel(modelId: string): SupportedChatModel | undefined {
    return SUPPORTED_CHAT_MODELS.find((model) => model.id === modelId);
}

export const DEFAULT_CHAT_MODEL_ID: SupportedChatModelId = "gpt-5.4";