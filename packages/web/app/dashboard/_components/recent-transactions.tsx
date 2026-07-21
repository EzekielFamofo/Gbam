"use client";

import type { DashboardTransactionItem } from "@gbam/shared";
import { formatCredits, formatDateTime } from "@/lib/dashboard/format";
import { EmptyState } from "./empty-state";

function getTransactionTitle(transaction: DashboardTransactionItem) {
  return  transaction.description ?? "CLI usage";
}

export function RecentTransactions({ transactions }: { transactions: DashboardTransactionItem[] }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Recent usage</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Usage-only transaction history for now. Credit purchases can be added later through Polar sync.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {transactions.length === 0 ? (
          <EmptyState
            title="No usage yet"
            description="When your GBAM sessions use credits, they will appear here automatically."
          />
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="rounded-2xl border border-border bg-background/50 px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-sm font-semibold text-foreground">
                    {getTransactionTitle(transaction)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {transaction.sessionId ? (
                      <span className="rounded-full border border-border px-2 py-0.5">
                        Linked session
                      </span>
                    ) : null}
                    <span>{formatDateTime(transaction.createdAt)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-base font-semibold text-primary">
                    {transaction.creditsDelta > 0 ? "+" : ""}
                    {formatCredits(transaction.creditsDelta)}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{transaction.type}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
