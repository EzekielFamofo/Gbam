import {
    SUPPORTED_CHAT_MODELS,
    findSupportedChatModel,
    convertNgnCostToCredits,
    type ModelPricing,
} from "@gbam/shared";
import type { LanguageModelUsage } from "ai";

type CalculateCreditsForUsageParams = {
    provider: string;
    model: string;
    usage: LanguageModelUsage;
};

type BillableUsage = {
    credits: number;
};

type TokenCounts = {
    inputTokens: number;
    outputTokens: number;
}

const TOKENS_PER_MILLION = 1_000_000;

function getTokenCounts(usage: LanguageModelUsage): TokenCounts {
    const inputTokens = usage.inputTokens;
    const outputTokens = usage.outputTokens;

    if (
        inputTokens == null ||
        outputTokens == null ||
        !Number.isFinite(inputTokens) ||
        !Number.isFinite(outputTokens) ||
        !Number.isInteger(inputTokens) ||
        !Number.isInteger(outputTokens) ||
        inputTokens < 0 ||
        outputTokens < 0
    ) {
        console.error("Invalid token counts encountered:", { inputTokens, outputTokens });
        throw new Error("Credit conversion requires valid input and output token counts");
    } 

    return {
        inputTokens,
        outputTokens,
    };
};

function getModelPricing(provider: string, model: string): ModelPricing {
    const supportedModel = findSupportedChatModel(model);
    if (!supportedModel || supportedModel.provider !== provider) {
        if (!SUPPORTED_CHAT_MODELS.some((supportedModel) => supportedModel.provider === provider)) {
            throw new Error(`Unsupported billing provider: ${provider}`);
        }

        throw new Error(`Unsupported billing model: ${model}`);
    }

    return supportedModel.pricing;
};

function estimateCostNgN({ inputTokens, outputTokens}: TokenCounts, pricing: ModelPricing) {
    return (
        (inputTokens * pricing.inputNgNPerMillionTokens + outputTokens * pricing.outputNgNPerMillionTokens) / TOKENS_PER_MILLION
    );
};

export function CalculateCreditsForUsage({ provider, model, usage, }: CalculateCreditsForUsageParams): BillableUsage {
    const tokenCounts = getTokenCounts(usage);
    const pricing = getModelPricing(provider, model);
    const estimatedCostNgN = estimateCostNgN(tokenCounts, pricing);
    const credits = convertNgnCostToCredits(estimatedCostNgN);

    return {
        credits,
    };
};