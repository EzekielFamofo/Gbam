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

function formatProjectPath(path: string | null | undefined) {
  if (!path) return "—";
  
  const separator = path.includes("\\") ? "\\" : "/";
  const parts = path.split(separator);

  if (parts.length <= 3) {
    return path.length > 25 ? `${path.slice(0, 10)}...${path.slice(-10)}` : path;
  }

  const start = parts.slice(0, 2).join(separator);
  const end = parts[parts.length - 1];
  
  return `${start}${separator}...${separator}${end}`;
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
        session.projectPath ?? "",
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [query, sessions]);

  return (
    <section className="rounded-xl border border-border/60 bg-card/40 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-display text-base font-semibold">All sessions</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Search and manage every CLI session linked to this account by title, path, mode, model, or status.
          </p>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search sessions by title or path..."
          className="h-9 w-full rounded-md border border-border/60 bg-background/60 px-3 text-xs outline-none ring-0 transition focus:border-primary md:max-w-xs"
        />
      </div>

      {filteredSessions.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title={sessions.length === 0 ? "No sessions yet" : "No matching sessions"}
            description={
              sessions.length === 0
                ? "Run GBAM from your terminal and your completed sessions will begin to appear here."
                : "Try a different search term for title, path, mode, model, or status."
            }
          />
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-lg border border-border/50 bg-background/50">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border/40 text-xs">
              <thead>
                <tr className="bg-muted/20 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 pl-5 pr-4">Session</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Project Path</th>
                  <th className="py-3 px-4">Last activity</th>
                  <th className="py-3 px-4">Credits used</th>
                  <th className="py-3 px-4">Model</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 pl-4 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredSessions.map((session) => (
                  <tr key={session.id} className="align-middle hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 pl-5 pr-4">
                      <div>
                        <p className="font-semibold text-foreground" title={session.title}>
                          {session.title}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground">{session.id}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {session.lastMode ? (
                        <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-mono font-medium uppercase ${getModeClasses(session.lastMode)}`}>
                          {session.lastMode}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                      {session.projectPath ? (
                         <span 
                           className="font-mono text-[11px] text-muted-foreground/80 cursor-help" 
                           title={session.projectPath}
                         >
                           {formatProjectPath(session.projectPath)}
                         </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                      {formatDateTime(session.lastActivityAt)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {formatCredits(session.creditsUsed)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-muted-foreground">{session.lastModel ?? "—"}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex rounded-md border border-border/60 bg-muted/60 px-2 py-0.5 text-[10px] font-mono uppercase font-medium text-muted-foreground">
                        {formatStatus(session.status)}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 pr-5 text-right">
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
        </div>
      )}
    </section>
  );
}