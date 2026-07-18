import {
    SUPPORTED_CHAT_MODELS,
    findSupportedChatModel,
    type ModelPricing
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

// gbam charges in internal credits. 
// We peg 1 credit to $0.01 USD. 
// At 1,400 NGN per USD, 1 credit = 14 NGN.
const NGN_PER_CREDIT = 14;

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

function convertNgNToCredits(estimateCostNgN: number) {
    if (estimateCostNgN <= 0) {
        return 0;
    }

    return Math.max(1, Math.ceil(estimateCostNgN / NGN_PER_CREDIT));
};

export function CalculateCreditsForUsage({ provider, model, usage, }: CalculateCreditsForUsageParams): BillableUsage {
    const tokenCounts = getTokenCounts(usage);
    const pricing = getModelPricing(provider, model);
    const estimatedCostNgN = estimateCostNgN(tokenCounts, pricing);
    const credits = convertNgNToCredits(estimatedCostNgN); 

    return {
        credits,
    };
};