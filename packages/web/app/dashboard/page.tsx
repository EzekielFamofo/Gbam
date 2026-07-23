import { auth } from "@clerk/nextjs/server";
import { DashboardSummaryCards } from "./_components/dashboard-summary";
import { DashboardDataView } from "./_components/dashboard-data-view";
import { DashboardPageHeader, DashboardShell, DashboardUnavailable } from "./_components/dashboard-shell";
import { RecentSessions } from "./_components/recent-sessions";
import { RecentTransactions } from "./_components/recent-transactions";
import { getDashboardData } from "@/lib/dashboard/get-dashboard";

export default async function DashboardPage() {
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
    <DashboardShell currentPath="/dashboard">
      {dashboardError || !dashboardData ? (
        <DashboardUnavailable message={dashboardError ?? "The dashboard data could not be loaded right now."} />
      ) : (
        <DashboardDataView initialData={dashboardData}>
          {({ dashboard, refreshDashboard }) => (
            <div className="space-y-6">
              <DashboardPageHeader
                title="Overview"
                description="A live snapshot of your credits balance, latest sessions, and recent usage tied to the GBAM CLI account you use every day."
              />

              <DashboardSummaryCards summary={dashboard.summary} />

              <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <RecentSessions sessions={dashboard.sessions.slice(0, 5)} onUpdated={refreshDashboard} />
                <RecentTransactions transactions={dashboard.transactions.slice(0, 6)} />
              </section>
            </div>
          )}
        </DashboardDataView>
      )}
    </DashboardShell>
  );
}
