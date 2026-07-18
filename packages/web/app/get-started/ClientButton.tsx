"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

export function ClientButton({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4 font-mono text-sm text-primary">
      <span>{label}</span>
      <button
        onClick={() => navigator.clipboard.writeText(label)}
        className="p-1.5 rounded bg-muted hover:bg-muted-foreground/10 text-muted-foreground transition-colors"
      >
        <Copy className="size-4" />
      </button>
    </div>
  );
}
