"use client";

import { useMemo, useState } from "react";
import type { DashboardSessionItem } from "@gbam/shared";
import { formatCredits, formatDateTime } from "@/lib/dashboard/format";
import { DeleteSessionButton } from "./delete-session-button";
import { EmptyState } from "./empty-state";
import { RenameSessionButton } from "./rename-session-button";

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

function getModeClasses(mode: DashboardSessionItem["lastMode"]) {
  if (mode === "BUILD") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  }

  return "border-primary/20 bg-primary/10 text-primary";
}

export function SessionsTable({
  sessions,
  onUpdated,
}: {
  sessions: DashboardSessionItem[];
  onUpdated?: () => void | Promise<void>;
}) {
  const [query, setQuery] = useState("");

  const filteredSessions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return sessions;
    }

    return sessions.filter((session) => {
      return [
        session.title,
        session.lastMode ?? "",
        session.lastModel ?? "",
        session.status,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [query, sessions]);

  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-display text-xl font-semibold">All sessions</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Search and manage every CLI session linked to this account.
          </p>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search sessions"
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none ring-0 transition focus:border-primary md:max-w-xs"
        />
      </div>

      {filteredSessions.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title={sessions.length === 0 ? "No sessions yet" : "No matching sessions"}
            description={
              sessions.length === 0
                ? "Run GBAM from your terminal and your completed sessions will begin to appear here."
                : "Try a different search term for title, mode, model, or status."
            }
          />
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Session</th>
                <th className="pb-3 pr-4 font-medium">Mode</th>
                <th className="pb-3 pr-4 font-medium">Last activity</th>
                <th className="pb-3 pr-4 font-medium">Credits used</th>
                <th className="pb-3 pr-4 font-medium">Model</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="align-top">
                  <td className="py-4 pr-4">
                    <div>
                      <p className="font-display font-semibold text-foreground" title={session.title}>
                        {session.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{session.id}</p>
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    {session.lastMode ? (
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${getModeClasses(session.lastMode)}`}>
                        {session.lastMode}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-4 pr-4 text-muted-foreground">{formatDateTime(session.lastActivityAt)}</td>
                  <td className="py-4 pr-4 font-medium text-foreground">{formatCredits(session.creditsUsed)}</td>
                  <td className="py-4 pr-4 text-muted-foreground">{session.lastModel ?? "—"}</td>
                  <td className="py-4 pr-4">
                    <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-foreground">
                      {formatStatus(session.status)}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <RenameSessionButton sessionId={session.id} sessionTitle={session.title} onUpdated={onUpdated} />
                      <DeleteSessionButton sessionId={session.id} sessionTitle={session.title} onDeleted={onUpdated} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
