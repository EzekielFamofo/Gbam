import { auth } from "@clerk/nextjs/server";
import { DashboardShell } from "../_components/dashboard-shell";
import { DashboardPageHeader } from "../_components/dashboard-header";
import { EmptyState } from "../_components/empty-state";
import { SpendLimitsForm } from "../_components/spend-limits-form";
import { getSpendLimits } from "@/lib/dashboard/get-spend-limits";

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
        <DashboardPageHeader
          title="Limits"
          description="Cap how many credits your sessions can use per day or per month."
        />
        {limitsError || !limitsData ? (
          <section className="rounded-3xl border border-border bg-card p-6">
            <EmptyState
              title="Limits unavailable"
              description={limitsError ?? "Spend limits could not be loaded right now."}
            />
          </section>
        ) : (
          <SpendLimitsForm initialData={limitsData} />
        )}
      </div>
    </DashboardShell>
  );
}