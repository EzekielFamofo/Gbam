import type { DashboardSummary } from "@gbam/shared";
import { CreditCard, Clock3, TrendingUp } from "lucide-react";
import { formatCredits, formatRelativeDate } from "@/lib/dashboard/format";

export function DashboardSummaryCards({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CreditCard className="size-4 text-primary" /> Current credits
        </div>
        <p className="mt-3 font-display text-3xl font-semibold text-foreground">
          {formatCredits(summary.creditsBalance)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{formatSyncStatus(summary.lastCreditsSyncedAt)}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <TrendingUp className="size-4 text-primary" /> Credits used this month
        </div>
        <p className="mt-3 font-display text-3xl font-semibold text-foreground">
          {formatCredits(summary.creditsUsedThisMonth)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Usage currently tracked through the internal GBAM ledger</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Clock3 className="size-4 text-primary" /> Last CLI activity
        </div>
        <p className="mt-3 font-display text-2xl font-semibold text-foreground">
          {formatRelativeDate(summary.lastCliActivityAt)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Most recent synced session activity</p>
      </div>
    </div>
  );
}
