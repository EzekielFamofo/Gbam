import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardUnavailable({ message }: { message: string }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Dashboard temporarily unavailable</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{message}</p>
        </div>
        <Terminal className="size-5 text-primary" />
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/docs">
          <Button variant="outline" className="gap-2">
            Read docs <ExternalLink className="size-4" />
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
    <section className="rounded-3xl border border-border bg-card p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {controls ? <div className="flex flex-wrap items-center gap-2">{controls}</div> : null}
      </div>
    </section>
  );
}