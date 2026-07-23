import { DashboardDataView } from "../_components/dashboard-data-view";
import { DashboardPageHeader, DashboardShell, DashboardUnavailable } from "../_components/dashboard-shell";
import { UsageDashboard } from "../_components/usage-dashboard";
import { getDashboardData } from "@/lib/dashboard/get-dashboard";
import { auth } from "@clerk/nextjs/server";

export default async function DashboardUsagePage() {
  const { userId } = await auth();

  let dashboardData = null;
  let dashboardError: string | null = null;

  if (userId) {
    try {
      dashboardData = await getDashboardData(userId);
    } catch (error) {
      dashboardError = error instanceof Error ? error.message : "Failed to load dashboard";
    }
  }

  return (
    <DashboardShell currentPath="/dashboard/usage">
      {dashboardError || !dashboardData ? (
        <DashboardUnavailable message={dashboardError ?? "The dashboard data could not be loaded right now."} />
      ) : (
        <DashboardDataView initialData={dashboardData}>
          {({ dashboard }) => (
            <div className="space-y-6">
              <DashboardPageHeader
                title="Usage"
                description="Review recent credit consumption, transaction activity, and lightweight usage trends."
              />
              <UsageDashboard transactions={dashboard.transactions} />
            </div>
          )}
        </DashboardDataView>
      )}
    </DashboardShell>
  );
}
