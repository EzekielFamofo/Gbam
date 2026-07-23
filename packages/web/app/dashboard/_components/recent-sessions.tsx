"use client";

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

function truncateSessionTitle(title: string, maxWords = 6) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return title;
  }
  return `${words.slice(0, maxWords).join(" ")}…`;
}

type Props = {
  sessions: DashboardSessionItem[];
  onUpdated?: () => void | Promise<void>;
};

export function RecentSessions({ sessions, onUpdated }: Props) {
  return (
    <section className="rounded-xl border border-border/60 bg-card/40 overflow-hidden">
      <div className="border-b border-border/60 px-5 py-4 bg-muted/20">
        <h2 className="font-display text-base font-semibold">Recent sessions</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          The latest CLI sessions linked to this account, with their mode, model, and credits used.
        </p>
      </div>

      <div className="p-4">
        {sessions.length === 0 ? (
          <EmptyState
            title="No sessions yet"
            description="Run GBAM from your terminal and your completed sessions will begin to appear here."
          />
        ) : (
          <div className="divide-y divide-border/40 rounded-lg border border-border/50 bg-background/50 overflow-hidden">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-3.5 text-xs hover:bg-muted/20 transition-colors"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-sm text-foreground" title={session.title}>
                        {truncateSessionTitle(session.title)}
                      </p>
                      <RenameSessionButton sessionId={session.id} sessionTitle={session.title} onUpdated={onUpdated} />
                      {session.lastMode ? (
                        <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-emerald-400 border border-emerald-500/20">
                          {session.lastMode}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                      <span>
                        Status: <span className="text-foreground font-medium">{formatStatus(session.status)}</span>
                      </span>
                      <span>•</span>
                      <span>
                        Model: <code className="font-mono text-foreground">{session.lastModel || "-"}</code>
                      </span>
                      <span>•</span>
                      <span>
                        Credits: <span className="font-mono font-semibold text-foreground">{formatCredits(session.creditsUsed)}</span>
                      </span>
                      <span>•</span>
                      <span>{formatDateTime(session.lastActivityAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center">
                    <DeleteSessionButton sessionTitle={session.title} sessionId={session.id} onDeleted={onUpdated} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}