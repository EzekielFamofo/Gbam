"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardResponse } from "@gbam/shared";
import { DashboardSummaryCards } from "./dashboard-summary";
import { RecentSessions } from "./recent-sessions";
import { RecentTransactions } from "./recent-transactions";

async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await fetch("/api/dashboard", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch dashboard");
  }

  return res.json() as Promise<DashboardResponse>;
}

export function LiveDashboard({ initialData }: { initialData: DashboardResponse }) {
  const [dashboard, setDashboard] = useState(initialData);
  const isMountedRef = useRef(true);

  const refreshDashboard = useCallback(async () => {
    try {
      const nextDashboard = await fetchDashboard();
      if (isMountedRef.current) {
        setDashboard(nextDashboard);
      }
    } catch {
      // Ignore transient polling failures and keep the last successful dashboard snapshot.
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      await refreshDashboard();
      if (isMountedRef.current) {
        timerId = setTimeout(poll, 4000);
      }
    };

    void poll();

    return () => {
      isMountedRef.current = false;
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [refreshDashboard]);

  return (
    <>
      <section className="mt-6">
        <DashboardSummaryCards summary={dashboard.summary} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <RecentSessions sessions={dashboard.sessions} />
        <RecentTransactions transactions={dashboard.transactions} />
      </section>
    </>
  );
}
