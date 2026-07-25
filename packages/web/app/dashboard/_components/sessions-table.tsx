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
  const parts = path.split(separator).filter(Boolean);

  if (parts.length <= 2) {
    return path.length > 25 ? `${path.slice(0, 10)}...${path.slice(-10)}` : path;
  }

  const start = parts[0];
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
          {/* Scrollable container with styled scrollbars matching dark theme */}
          <div className="overflow-x-auto [scrollbar-width:thin] [scrollbar-color:hsl(var(--border)/0.8)_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40">
            <table className="w-full text-left text-xs divide-y divide-border/40">
              <thead>
                <tr className="bg-muted/20 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="py-2.5 pl-4 pr-3">Session</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3">Project Path</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Last activity</th>
                  <th className="py-2.5 px-3">Credits</th>
                  <th className="py-2.5 px-3">Model</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 pl-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredSessions.map((session) => (
                  <tr key={session.id} className="align-middle hover:bg-muted/20 transition-colors">
                    <td className="py-3 pl-4 pr-3 max-w-[180px]">
                      <div className="truncate">
                        <p className="font-semibold text-foreground truncate" title={session.title}>
                          {session.title}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground truncate">{session.id}</p>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {session.lastMode ? (
                        <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-mono font-medium uppercase ${getModeClasses(session.lastMode)}`}>
                          {session.lastMode}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 max-w-[150px] truncate text-muted-foreground">
                      {session.projectPath ? (
                        <span 
                          className="font-mono text-[11px] text-muted-foreground/90 cursor-help" 
                          title={session.projectPath}
                        >
                          {formatProjectPath(session.projectPath)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground whitespace-nowrap text-[11px]">
                      {formatDateTime(session.lastActivityAt)}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-foreground whitespace-nowrap">
                      {formatCredits(session.creditsUsed)}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-muted-foreground max-w-[120px] truncate" title={session.lastModel ?? ""}>
                      {session.lastModel ?? "—"}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex rounded-md border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono uppercase font-medium text-muted-foreground">
                        {formatStatus(session.status)}
                      </span>
                    </td>
                    <td className="py-3 pl-3 pr-4 text-right">
                      <div className="flex justify-end gap-1.5">
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