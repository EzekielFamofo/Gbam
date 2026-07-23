"use client";

import { useDashboard } from "../_components/dashboard-data-view";
import { DashboardPageHeader } from "./dashboard-header";
import { SessionsTable } from "../_components/sessions-table";

export function DashboardSessionsContent() {
  const { dashboard, refreshDashboard } = useDashboard();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Sessions"
        description="Browse the full session history for your CLI activity and manage titles or cleanup from one place."
      />
      <SessionsTable sessions={dashboard.sessions} onUpdated={refreshDashboard} />
    </div>
  );
}