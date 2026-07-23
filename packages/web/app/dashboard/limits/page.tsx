import { auth } from "@clerk/nextjs/server";
import { DashboardShell } from "../_components/dashboard-shell";
import { EmptyState } from "../_components/empty-state";
import { SpendLimitsForm } from "../_components/spend-limits-form";
import { getSpendLimits } from "@/lib/dashboard/get-spend-limits";
import { SlidersHorizontal } from "lucide-react";

export default async function DashboardLimitsPage() {
  const { userId } = await auth();

  let limitsData = null;
  let limitsError: string | null = null;

  if (userId) {
    try {
      limitsData = await getSpendLimits(userId);
    } catch (error) {
      limitsError = error instanceof Error ? error.message : "Failed to load spend limits";
    }
  }

  return (
    <DashboardShell currentPath="/dashboard/limits">
      <div className="space-y-6">
        <section className="rounded-xl border border-border/60 bg-card/40 p-5">
          <div>
            <h3 className="font-display text-base font-semibold flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-primary" /> Spending limits
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Cap how many credits your sessions can use per day or per month. Leave a field blank for no limit.
            </p>
          </div>

          <div className="mt-6 rounded-lg border border-border/50 bg-background/50 p-5">
            {limitsError || !limitsData ? (
              <EmptyState
                title="Limits unavailable"
                description={limitsError ?? "Spend limits could not be loaded right now."}
              />
            ) : (
              <SpendLimitsForm initialData={limitsData} />
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}