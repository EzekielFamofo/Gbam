"use client";

import type { DashboardSessionItem } from "@gbam/shared";
import { formatCredits, formatDateTime } from "@/lib/dashboard/format";
import { DeleteSessionButton } from "./delete-session-button";
import { EmptyState } from "./empty-state";
import { RenameSessionButton } from "./rename-session-button";
import { useEffect, useState, useRef } from "react";

function formatStatus(status: DashboardSessionItem["status"]) {
  switch (status) {
    case "complete":
      return "Complete";
    case "waiting":
      return "Waiting";
    default:
      return "New";
  }
}

function truncateSessionTitle(title: string, maxWords = 6) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return title;
  }
  return `${words.slice(0, maxWords).join(" ")}…`;
}

// Find the API endpoint for recent sessions (REST or custom route)
// We'll fetch from /api/dashboard (or as appropriate) using current user context
// Expect the GET /dashboard returns { sessions: DashboardSessionItem[] }
async function fetchSessions(): Promise<DashboardSessionItem[]> {
  const res = await fetch("/api/dashboard", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch sessions");
  const data = await res.json();
  return data.sessions || [];
}

export function RecentSessions({ sessions: initialSessions }: { sessions: DashboardSessionItem[] }) {
  // state for live data
  const [sessions, setSessions] = useState<DashboardSessionItem[]>(initialSessions);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Poll every 4 seconds
    function poll() {
      fetchSessions().then(setSessions).catch(() => {});
    }
    pollingRef.current = setInterval(poll, 4000);
    // Also do an immediate fetch
    poll();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Recent sessions</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The latest CLI sessions linked to this account, with their mode, model, and credits used.
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {sessions.length === 0 ? (
          <EmptyState
            title="No sessions yet"
            description="Run GBAM from your terminal and your completed sessions will begin to appear here."
          />
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="rounded-2xl border border-border bg-background/50 px-4 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-base font-semibold text-foreground" title={session.title}>
                      {truncateSessionTitle(session.title)}
                    </p>
                    <RenameSessionButton sessionId={session.id} sessionTitle={session.title} />
                    {session.lastMode ? (
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        {session.lastMode}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Status: {formatStatus(session.status)}</span>
                    <span>Model: {session.lastModel || "-"}</span>
                    <span>Credits used: {formatCredits(session.creditsUsed)}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Last updated: {formatDateTime(session.lastActivityAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2 self-end">
                  <DeleteSessionButton sessionId={session.id} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
