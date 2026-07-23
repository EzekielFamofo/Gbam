"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DashboardResponse } from "@gbam/shared";

type Props = {
  initialData: DashboardResponse;
  children: (props: { dashboard: DashboardResponse; refreshDashboard: () => Promise<void> }) => ReactNode;
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
  const initialSignature = useMemo(() => JSON.stringify(initialData), [initialData]);
  const isMountedRef = useRef(true);

  useEffect(() => {
    setDashboard(initialData);
  }, [initialSignature, initialData]);

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

  return <>{children({ dashboard, refreshDashboard })}</>;
}
