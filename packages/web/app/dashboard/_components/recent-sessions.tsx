"use client";

import type { DashboardSessionItem } from "@gbam/shared";
import { formatCredits, formatDateTime } from "@/lib/dashboard/format";
import { DeleteSessionButton } from "./delete-session-button";
import { EmptyState } from "./empty-state";

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

export function RecentSessions({ sessions }: { sessions: DashboardSessionItem[] }) {
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
                    {session.lastMode ? (
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        {session.lastMode}
                      </span>
                    ) : null}
                    <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                      {formatStatus(session.status)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{session.lastModel ?? "Model not recorded"}</span>
                    <span>•</span>
                    <span>{formatDateTime(session.lastActivityAt)}</span>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 text-left md:items-end md:text-right">
                  <div>
                    <p className="font-display text-lg font-semibold text-foreground">
                      {formatCredits(session.creditsUsed)} credits
                    </p>
                    <p className="text-xs text-muted-foreground">Used in this session</p>
                  </div>
                  <DeleteSessionButton sessionId={session.id} sessionTitle={session.title} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
