"use client";

import { useDashboard } from "./dashboard-data-view";
import { DashboardPageHeader } from "./dashboard-shell";
import { DashboardSummaryCards } from "./dashboard-summary";
import { RecentSessions } from "./recent-sessions";
import { RecentTransactions } from "./recent-transactions";

export function DashboardOverviewContent() {
  const { dashboard, refreshDashboard } = useDashboard();

  return (
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
  );
}