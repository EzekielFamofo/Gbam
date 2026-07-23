import type { DashboardSummary } from "@gbam/shared";
import { CreditCard, Clock3, TrendingUp } from "lucide-react";
import { formatCredits, formatRelativeDate } from "@/lib/dashboard/format";

export function DashboardSummaryCards({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Current Credits */}
      <div className="rounded-xl border border-border/60 bg-card/50 p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Current credits</span>
          <CreditCard className="size-4 text-primary" />
        </div>
        <div className="mt-2">
          <span className="font-mono text-2xl font-bold tracking-tight text-foreground">
            {formatCredits(summary.creditsBalance)}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">Available balance for CLI tasks</p>
      </div>

      {/* Credits Used This Month */}
      <div className="rounded-xl border border-border/60 bg-card/50 p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Credits used this month</span>
          <TrendingUp className="size-4 text-primary" />
        </div>
        <div className="mt-2">
          <span className="font-mono text-2xl font-bold tracking-tight text-foreground">
            {formatCredits(summary.creditsUsedThisMonth)}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">Consumed across recent sessions</p>
      </div>

      {/* Last CLI Activity */}
      <div className="rounded-xl border border-border/60 bg-card/50 p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Last CLI activity</span>
          <Clock3 className="size-4 text-emerald-500" />
        </div>
        <div className="mt-2">
          <span className="text-xl font-semibold tracking-tight text-foreground">
            {formatRelativeDate(summary.lastCliActivityAt)}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">Your most recent session activity</p>
      </div>
    </div>
  );
}