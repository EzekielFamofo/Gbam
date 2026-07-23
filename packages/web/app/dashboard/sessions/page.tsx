import { DashboardDataView } from "../_components/dashboard-data-view";
import { DashboardPageHeader, DashboardShell, DashboardUnavailable } from "../_components/dashboard-shell";
import { SessionsTable } from "../_components/sessions-table";
import { getDashboardData } from "@/lib/dashboard/get-dashboard";
import { auth } from "@clerk/nextjs/server";

export default async function DashboardSessionsPage() {
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
    <DashboardShell currentPath="/dashboard/sessions">
      {dashboardError || !dashboardData ? (
        <DashboardUnavailable message={dashboardError ?? "The dashboard data could not be loaded right now."} />
      ) : (
        <DashboardDataView initialData={dashboardData}>
          {({ dashboard, refreshDashboard }) => (
            <div className="space-y-6">
              <DashboardPageHeader
                title="Sessions"
                description="Browse the full session history for your CLI activity and manage titles or cleanup from one place."
              />
              <SessionsTable sessions={dashboard.sessions} onUpdated={refreshDashboard} />
            </div>
          )}
        </DashboardDataView>
      )}
    </DashboardShell>
  );
}
