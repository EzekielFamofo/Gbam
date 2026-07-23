"use client";

import { useMemo, useState } from "react";
import type { DashboardTransactionItem } from "@gbam/shared";
import { formatCredits, formatDateTime } from "@/lib/dashboard/format";
import { EmptyState } from "./empty-state";

const rangeOptions = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
] as const;

type RangeValue = (typeof rangeOptions)[number]["value"];

function getCutoffDate(range: RangeValue) {
  const now = Date.now();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return now - days * 24 * 60 * 60 * 1000;
}

function getTransactionTitle(transaction: DashboardTransactionItem) {
  return transaction.description ?? "CLI usage";
}

export function UsageDashboard({ transactions }: { transactions: DashboardTransactionItem[] }) {
  const [range, setRange] = useState<RangeValue>("30d");
  const [query, setQuery] = useState("");

  const { filteredTransactions, totalUsage, groupedByDay, breakdown } = useMemo(() => {
    const cutoff = getCutoffDate(range);
    const normalizedQuery = query.trim().toLowerCase();

    const filteredByRange = transactions.filter((transaction) => {
      return new Date(transaction.createdAt).getTime() >= cutoff;
    });

    const filteredTransactions = normalizedQuery
      ? filteredByRange.filter((transaction) => {
          return [
            getTransactionTitle(transaction),
            transaction.type,
            transaction.sessionId ?? "",
          ].some((value) => value.toLowerCase().includes(normalizedQuery));
        })
      : filteredByRange;

    const usageTransactions = filteredTransactions.filter((transaction) => transaction.creditsDelta < 0);
    const totalUsage = usageTransactions.reduce((sum, transaction) => sum + Math.abs(transaction.creditsDelta), 0);

    const groupedMap = new Map<string, number>();
    for (const transaction of usageTransactions) {
      const day = new Date(transaction.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      groupedMap.set(day, (groupedMap.get(day) ?? 0) + Math.abs(transaction.creditsDelta));
    }

    const groupedByDay = Array.from(groupedMap.entries()).map(([label, value]) => ({ label, value }));
    const maxValue = Math.max(...groupedByDay.map((item) => item.value), 0);

    const typeMap = new Map<string, number>();
    for (const transaction of filteredTransactions) {
      typeMap.set(transaction.type, (typeMap.get(transaction.type) ?? 0) + Math.abs(transaction.creditsDelta));
    }

    const breakdown = Array.from(typeMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    return {
      filteredTransactions,
      totalUsage,
      groupedByDay: groupedByDay.map((item) => ({
        ...item,
        percentage: maxValue > 0 ? (item.value / maxValue) * 100 : 0,
      })),
      breakdown,
    };
  }, [query, range, transactions]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-display text-xl font-semibold">Usage overview</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Track recent credit usage and transaction activity over time.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {rangeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRange(option.value)}
                className={option.value === range ? "rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" : "rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:text-foreground"}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-border bg-background/50 p-4">
            <p className="text-sm font-medium text-muted-foreground">Credits used in range</p>
            <p className="mt-2 font-display text-3xl font-semibold text-foreground">{formatCredits(totalUsage)}</p>
            <div className="mt-5 space-y-3">
              {groupedByDay.length === 0 ? (
                <p className="text-sm text-muted-foreground">No usage data in this range yet.</p>
              ) : (
                groupedByDay.map((item) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.label}</span>
                      <span>{formatCredits(item.value)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background/50 p-4">
            <p className="text-sm font-medium text-muted-foreground">Transaction breakdown</p>
            <div className="mt-4 space-y-3">
              {breakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No transactions in this range yet.</p>
              ) : (
                breakdown.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                    <span className="text-sm capitalize text-foreground">{item.label}</span>
                    <span className="font-medium text-foreground">{formatCredits(item.value)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-display text-xl font-semibold">Transaction history</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Search recent dashboard transaction records.
            </p>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search usage"
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none ring-0 transition focus:border-primary md:max-w-xs"
          />
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="No usage yet"
              description="When your GBAM sessions use credits, they will appear here automatically."
            />
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Description</th>
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Linked session</th>
                  <th className="pb-3 pr-4 font-medium">Type</th>
                  <th className="pb-3 font-medium text-right">Credits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="py-4 pr-4">
                      <div>
                        <p className="font-medium text-foreground">{getTransactionTitle(transaction)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{transaction.id}</p>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-muted-foreground">{formatDateTime(transaction.createdAt)}</td>
                    <td className="py-4 pr-4 text-muted-foreground">{transaction.sessionId ?? "—"}</td>
                    <td className="py-4 pr-4">
                      <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-[11px] font-medium capitalize text-foreground">
                        {transaction.type}
                      </span>
                    </td>
                    <td className="py-4 text-right font-medium text-primary">
                      {transaction.creditsDelta > 0 ? "+" : ""}
                      {formatCredits(transaction.creditsDelta)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
