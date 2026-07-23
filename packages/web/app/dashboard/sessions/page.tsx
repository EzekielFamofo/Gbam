import { auth } from "@clerk/nextjs/server";
import { DashboardDataView } from "../_components/dashboard-data-view";
import { DashboardShell, DashboardUnavailable } from "../_components/dashboard-shell";
import { getDashboardData } from "@/lib/dashboard/get-dashboard";
import { DashboardSessionsContent } from "../_components/dashboard-sessions-content";

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
          <DashboardSessionsContent />
        </DashboardDataView>
      )}
    </DashboardShell>
  );
}