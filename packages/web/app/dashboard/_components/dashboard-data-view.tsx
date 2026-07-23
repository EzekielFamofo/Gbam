"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import type { DashboardResponse } from "@gbam/shared";

type DashboardContextType = {
  dashboard: DashboardResponse;
  refreshDashboard: () => Promise<void>;
};

const DashboardContext = createContext<DashboardContextType | null>(null);

type Props = {
  initialData: DashboardResponse;
  children: ReactNode;
};

async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await fetch("/api/dashboard", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch dashboard");
  }

  return res.json() as Promise<DashboardResponse>;
}

export function DashboardDataView({ initialData, children }: Props) {
  const [dashboard, setDashboard] = useState(initialData);
  const isMountedRef = useRef(true);

  useEffect(() => {
    setDashboard(initialData);
  }, [initialData]);

  const refreshDashboard = useCallback(async () => {
    try {
      const nextDashboard = await fetchDashboard();
      if (isMountedRef.current) {
        setDashboard(nextDashboard);
      }
    } catch {
      // Keep the latest successful snapshot.
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
    <DashboardContext.Provider value={{ dashboard, refreshDashboard }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardDataView");
  }
  return context;
}