"use client";

import { useDashboard } from "../_components/dashboard-data-view";
import { DashboardPageHeader } from "./dashboard-header";
import { UsageDashboard } from "../_components/usage-dashboard";

export function DashboardUsageContent() {
  const { dashboard } = useDashboard();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Usage"
        description="Review recent credit consumption and lightweight usage trends."
      />
      <UsageDashboard transactions={dashboard.transactions} />
    </div>
  );
}