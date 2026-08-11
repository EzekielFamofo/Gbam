import { Bot } from "lucide-react";

import {
    DEFAULT_CHAT_MODEL_ID,
    SUPPORTED_CHAT_MODELS,
    COST_TIER_OUTPUT_NGN_BANDS,
    convertNgnCostToCredits,
    type CostTier,
} from "@gbam/shared";

import { SectionCard } from "../_components/docs-ui";

const COST_TIER_ORDER: CostTier[] = [
    "$",
    "$$",
    "$$$",
    "$$$$",
];

function formatCredits(value: number): string {
    return new Intl.NumberFormat("en-NG", {
        maximumFractionDigits: 2,
    }).format(value);
}

function formatTierOutputRange(tier: CostTier): string {
    const band = COST_TIER_OUTPUT_NGN_BANDS[tier];

    const minCredits = convertNgnCostToCredits(
        band.minNgNPerMillionTokens,
    );

    if (band.maxNgNPerMillionTokensExclusive === null) {
        return `${formatCredits(minCredits)}+ credits output`;
    }

    const maxCredits = convertNgnCostToCredits(
        band.maxNgNPerMillionTokensExclusive,
    );

    return `${formatCredits(minCredits)}–<${formatCredits(maxCredits)} credits output`;
}

export default function DocsModelsPage() {
    return (
        <div className="space-y-8">
            <SectionCard>
                <div className="flex items-center gap-3">
                    <Bot className="size-5" />

                    <h1 className="text-2xl font-semibold">
                        Models
                    </h1>
                </div>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    The CLI lets you choose a model, but the server
                    remains the authority on whether a model ID is
                    supported. The default chat model is{" "}
                    <code>{DEFAULT_CHAT_MODEL_ID}</code>.
                </p>
            </SectionCard>

            <SectionCard>
                <div className="overflow-hidden rounded-lg border border-border">
                    <div className="grid grid-cols-[minmax(0,1.5fr)_110px_90px_120px] bg-muted/40 px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <div>Model</div>
                        <div>Provider</div>
                        <div>Cost</div>
                        <div>Thinking</div>
                    </div>

                    {SUPPORTED_CHAT_MODELS.map((model, index) => (
                        <div
                            key={model.id}
                            className={`grid grid-cols-[minmax(0,1.5fr)_110px_90px_120px] px-5 py-3 text-sm ${
                                index === SUPPORTED_CHAT_MODELS.length - 1
                                    ? ""
                                    : "border-b border-border"
                            }`}
                        >
                            <div className="truncate font-mono">
                                {model.id}
                            </div>

                            <div>{model.provider}</div>

                            <div>{model.costTier}</div>

                            <div>
                                {model.supportsThinking
                                    ? "Yes"
                                    : "No"}
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>

            <SectionCard>
                <h2 className="text-xl font-semibold">
                    What do the cost tiers mean?
                </h2>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Cost tiers are based on the model&apos;s{" "}
                    <strong>output-token price</strong> per million
                    tokens. The boundaries are fixed, so the tiers
                    never overlap.
                </p>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Input and output prices are still shown on each
                    model&apos;s pricing data. The tier itself is
                    determined by output cost because agentic coding
                    workloads can generate substantial output.
                </p>

                <div className="mt-5 space-y-3">
                    {COST_TIER_ORDER.map((tier) => (
                        <div
                            key={tier}
                            className="flex flex-wrap items-center gap-2 text-sm"
                        >
                            <span className="rounded-md bg-muted px-2 py-1 font-semibold">
                                {tier}
                            </span>

                            <span className="text-muted-foreground">
                                {formatTierOutputRange(tier)}{" "}
                                (per million tokens)
                            </span>
                        </div>
                    ))}
                </div>

                <p className="mt-5 text-sm leading-6 text-muted-foreground">
                    Credits are what you are actually charged. See{" "}
                    <strong>Dashboard &amp; billing</strong> for how
                    credits convert to Naira for each credit pack.
                </p>
            </SectionCard>

            <SectionCard>
                <h2 className="text-xl font-semibold">
                    Model picker search
                </h2>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    The model picker supports searching by model ID,
                    provider name, cost tier (
                    <code>$</code>, <code>$$</code>,{" "}
                    <code>$$$</code>, <code>$$$$</code>
                    ) and thinking-related keywords like{" "}
                    <code>thinking</code> or <code>think</code>.
                </p>
            </SectionCard>
        </div>
    );
}