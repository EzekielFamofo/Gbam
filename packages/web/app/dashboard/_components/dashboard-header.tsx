import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardUnavailable({ message }: { message: string }) {
  return (
    <section className="rounded-xl border border-border/60 bg-card/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Dashboard temporarily unavailable</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{message}</p>
        </div>
        <Terminal className="size-5 text-primary" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2.5">
        <Link href="/docs">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-2">
            Read docs <ExternalLink className="size-3.5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

export function DashboardPageHeader({
  title,
  description,
  controls,
}: {
  title: string;
  description: string;
  controls?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/60 bg-card/60 p-5 mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
        {controls ? <div className="flex flex-wrap items-center gap-2">{controls}</div> : null}
      </div>
    </section>
  );
}