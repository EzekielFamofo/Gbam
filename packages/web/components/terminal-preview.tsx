"use client";

import { useEffect, useState } from "react";

const lines = [
  { type: "prompt", text: "gbam \"add stripe webhook handling\"" },
  { type: "output", text: "→ reading packages/server/src/routes" },
  { type: "output", text: "→ writing routes/webhooks/stripe.ts" },
  { type: "output", text: "→ running type check" },
  { type: "done", text: "✓ done in 4.2s" },
];

export function TerminalPreview() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) {
      setVisibleLines(lines.length);
      return;
    }

    if (visibleLines >= lines.length) return;
    const timer = setTimeout(() => setVisibleLines((v) => v + 1), 650);
    return () => clearTimeout(timer);
  }, [visibleLines]);

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-12 -z-10 rounded-full bg-primary/20 blur-3xl motion-safe:animate-[pulse_5s_ease-in-out_infinite]"
      />
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
          <span className="size-2.5 rounded-full bg-destructive/70" />
          <span className="size-2.5 rounded-full bg-primary/40" />
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="space-y-2 p-5 font-display text-sm">
          {lines.slice(0, visibleLines).map((line, i) => (
            <div
              key={i}
              className={
                line.type === "prompt"
                  ? "text-foreground"
                  : line.type === "done"
                    ? "text-primary"
                    : "text-muted-foreground"
              }
            >
              {line.type === "prompt" ? "$ " : ""}
              {line.text}
            </div>
          ))}
          {visibleLines < lines.length && (
            <span className="inline-block h-4 w-2 motion-safe:animate-pulse bg-primary" />
          )}
        </div>
      </div>
    </div>
  );
}