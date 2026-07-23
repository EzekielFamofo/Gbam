import { DashboardShell } from "../_components/dashboard-shell";
import { DashboardPageHeader } from "../_components/dashboard-header";
import { EmptyState } from "../_components/empty-state";

export default async function DashboardLimitsPage() {
  return (
    <DashboardShell currentPath="/dashboard/limits">
      <div className="space-y-6">
        <DashboardPageHeader
          title="Limits"
          description="This route is reserved for future account limits, quota visibility, and enforcement details."
        />
        <section className="rounded-3xl border border-border bg-card p-6">
          <EmptyState
            title="Limits page coming soon"
            description="Account limits and quota controls are not implemented yet, but the route and sidebar slot are now in place."
          />
        </section>
      </div>
    </DashboardShell>
  );
}
