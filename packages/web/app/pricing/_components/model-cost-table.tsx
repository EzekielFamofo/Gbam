import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SUPPORTED_CHAT_MODELS,
  type CostTier,
  type SupportedProvider,
} from "@gbam/shared";

const TIER_STYLES: Record<CostTier, string> = {
  $: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  $$: "text-primary border-primary/30 bg-primary/10",
  $$$: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  $$$$: "text-red-400 border-red-500/30 bg-red-500/10",
};

const PROVIDER_LABELS: Partial<Record<SupportedProvider, string>> = {
  google: "Google",
  openai: "OpenAI",
  anthropic: "Anthropic",
  deepseek: "DeepSeek",
  qwen: "Qwen",
  stepfun: "StepFun",
  "bytedance-seed": "ByteDance",
  poolside: "Poolside",
  "z-ai": "Zhipu AI",
  moonshotai: "Moonshot AI",
  minimax: "MiniMax",
  inclusionai: "Inclusion AI",
};

export function ModelCostTable() {
  const providers = Array.from(
    new Set(SUPPORTED_CHAT_MODELS.map((model) => model.provider))
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {providers.map((provider) => (
        <div
          key={provider}
          className="rounded-2xl border border-border bg-background/60 p-5"
        >
          <p className="text-sm font-medium text-muted-foreground">
            {PROVIDER_LABELS[provider] ?? provider}
          </p>

          <div className="mt-3 divide-y divide-border/60">
            {SUPPORTED_CHAT_MODELS
              .filter((model) => model.provider === provider)
              .map((model) => (
                <div
                  key={model.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{model.id}</span>

                    {model.supportsThinking && (
                      <Brain
                        className="size-3.5 text-muted-foreground"
                        aria-label="Supports extended thinking"
                      />
                    )}
                  </div>

                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 font-mono text-xs font-semibold",
                      TIER_STYLES[model.costTier]
                    )}
                  >
                    {model.costTier}
                  </span>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}