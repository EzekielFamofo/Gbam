"use client";

import type { DashboardTransactionItem } from "@gbam/shared";
import { formatCredits, formatDateTime } from "@/lib/dashboard/format";
import { EmptyState } from "./empty-state";

const TRANSACTION_LABELS: Record<DashboardTransactionItem["type"], string> = {
  usage: "Usage",
  purchase: "Purchase",
  adjustment: "Adjustment",
  sync: "Sync",
  trial: "Free trial",
  expiration: "Expired",
};

function getTransactionTitle(transaction: DashboardTransactionItem) {
  if (transaction.description) return transaction.description;
  if (transaction.type === "purchase") return "Credit purchase";
  if (transaction.type === "adjustment") return "Balance adjustment";
  if (transaction.type === "sync") return "Balance sync";
  if (transaction.type === "trial") return "Free trial credits";
  if (transaction.type === "expiration") return "Unused credits expired";
  return "CLI usage";
}

function isExpiringSoon(expiresAt: string, withinDays = 30) {
  const daysUntil = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return daysUntil >= 0 && daysUntil <= withinDays;
}

export function RecentTransactions({ transactions }: { transactions: DashboardTransactionItem[] }) {
  return (
    <section className="rounded-xl border border-border/60 bg-card/40 overflow-hidden">
      <div className="border-b border-border/60 px-5 py-4 bg-muted/20">
        <h2 className="font-display text-base font-semibold">Recent transactions</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Usage and credit purchase history for your account.
        </p>
      </div>

      <div className="p-4">
        {transactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="Credit purchases and CLI usage will appear here automatically."
          />
        ) : (
          <div className="divide-y divide-border/40 rounded-lg border border-border/50 bg-background/50 overflow-hidden">
            {transactions.map((transaction) => {
              const isNegative = transaction.creditsDelta < 0;
              const showExpiry = transaction.expiresAt && (transaction.type === "purchase" || transaction.type === "trial");

              return (
                <div key={transaction.id} className="flex items-center justify-between p-3.5 text-xs hover:bg-muted/20 transition-colors">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                      {getTransactionTitle(transaction)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                      {transaction.sessionId ? (
                        <span className="inline-flex items-center rounded-md bg-muted/60 border border-border/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Linked session
                        </span>
                      ) : null}
                      <span className="text-[11px]">{formatDateTime(transaction.createdAt)}</span>
                      {showExpiry && (
                        <span
                          className={`text-[11px] ${
                            isExpiringSoon(transaction.expiresAt!) ? "text-amber-400" : "text-muted-foreground"
                          }`}
                        >
                          · Expires {formatDateTime(transaction.expiresAt!)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`font-mono font-bold text-sm ${isNegative ? "text-destructive" : "text-emerald-400"}`}>
                      {transaction.creditsDelta > 0 ? "+" : ""}
                      {formatCredits(transaction.creditsDelta)}
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {TRANSACTION_LABELS[transaction.type]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}