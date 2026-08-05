import { Bot } from "lucide-react";
import { DEFAULT_CHAT_MODEL_ID, SUPPORTED_CHAT_MODELS } from "@gbam/shared";
import { SectionCard } from "../_components/docs-ui";

export default function DocsModelsPage() {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3 text-primary">
        <Bot className="size-5" />
        <h2 className="font-display text-2xl font-semibold">Models</h2>
      </div>
      <p className="leading-7 text-muted-foreground">
        The CLI lets you choose a model, but the server remains the authority on whether a
        model ID is supported. The default chat model is
        <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-foreground">{DEFAULT_CHAT_MODEL_ID}</code>.
      </p>
      <div className="rounded-3xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1.5fr)_110px_90px_120px] border-b border-border bg-muted/40 px-5 py-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <span>Model</span>
          <span>Provider</span>
          <span>Cost</span>
          <span>Thinking</span>
        </div>
        {SUPPORTED_CHAT_MODELS.map((model, index) => (
          <div
            key={model.id}
            className={`grid grid-cols-[minmax(0,1.5fr)_110px_90px_120px] px-5 py-3 text-sm ${
              index === SUPPORTED_CHAT_MODELS.length - 1 ? "" : "border-b border-border"
            }`}
          >
            <code className="font-mono text-primary">{model.id}</code>
            <span className="text-muted-foreground">{model.provider}</span>
            <span className="text-muted-foreground">{model.costTier}</span>
            <span className="text-muted-foreground">{model.supportsThinking ? "Yes" : "No"}</span>
          </div>
        ))}
      </div>
      <SectionCard>
        <p className="font-display text-base font-semibold">Model picker search</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The model picker supports searching by model ID, provider name, cost tier
          (<code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-foreground">$</code>,
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-foreground">$$</code>,
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-foreground">$$$</code>,
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-foreground">$$$$</code>)
          and thinking-related keywords like "thinking" or "think".
        </p>
      </SectionCard>
    </section>
  );
}