"use client";

import { useMemo, useState } from "react";
import type { DashboardTransactionItem, DashboardSessionItem } from "@gbam/shared";
import { formatCredits, formatDateTime } from "@/lib/dashboard/format";
import { Search, Filter, Cpu, Check } from "lucide-react";
import { EmptyState } from "./empty-state";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const rangeOptions = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
] as const;

type RangeValue = (typeof rangeOptions)[number]["value"];

function getCutoffDate(range: RangeValue) {
  const now = Date.now();
  const days = range === "7d" ? 7 : 30;
  return now - days * 24 * 60 * 60 * 1000;
}

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

function toLocalDateKey(dateInput: string | Date | number): string {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const MODEL_HEX_COLORS = [
  "#3b82f6", // Primary / Blue
  "#34d399", // Emerald
  "#38bdf8", // Sky
  "#fbbf24", // Amber
  "#a78bfa", // Violet
];

type Props = {
  transactions: DashboardTransactionItem[];
  sessions?: DashboardSessionItem[];
};

// Custom Floating Tooltip for Daily Usage
function DailyTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-md border border-border/80 bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-xl">
        <p className="text-[11px] text-muted-foreground">{data.fullDate}</p>
        <p className="font-mono font-bold text-primary">
          {formatCredits(data.value)} credits
        </p>
      </div>
    );
  }
  return null;
}

// Custom Floating Tooltip for Multi-Model Telemetry
function ModelTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border/80 bg-popover/95 p-3 text-xs text-popover-foreground shadow-xl backdrop-blur-md space-y-1.5">
        <p className="font-medium text-muted-foreground mb-1">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 font-mono">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-foreground">{entry.name}:</span>
            <span className="font-bold text-primary">
              {formatCredits(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function UsageDashboard({ transactions, sessions = [] }: Props) {
  const [range, setRange] = useState<RangeValue>("30d");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [activeModels, setActiveModels] = useState<string[]>([]);

  // Map session IDs to their session objects for quick lookup
  const sessionMap = useMemo(() => {
    return new Map(sessions.map((s) => [s.id, s]));
  }, [sessions]);

  // Extract unique sessions for dropdown filter
  const availableSessions = useMemo(() => {
    const sessionIds = Array.from(
      new Set(transactions.map((t) => t.sessionId).filter(Boolean))
    ) as string[];
    return sessionIds.map((id) => {
      const session = sessionMap.get(id);
      return {
        id,
        title: session?.title ?? `Session ${id.slice(0, 8)}...`,
      };
    });
  }, [transactions, sessionMap]);

  // 1. Filtered Transactions for Chart & History Table
  const { filteredTransactions, totalUsage, dailySeries, breakdown, maxDailyValue } =
    useMemo(() => {
      const cutoff = getCutoffDate(range);
      const normalizedQuery = query.trim().toLowerCase();

      const filteredByRange = transactions.filter((transaction) => {
        return new Date(transaction.createdAt).getTime() >= cutoff;
      });

      const filteredBySession =
        selectedSessionId === "all"
          ? filteredByRange
          : filteredByRange.filter((t) => t.sessionId === selectedSessionId);

      const filteredTransactions = normalizedQuery
        ? filteredBySession.filter((transaction) => {
            return [
              getTransactionTitle(transaction),
              transaction.type,
              transaction.sessionId ?? "",
              transaction.id,
            ].some((value) => value.toLowerCase().includes(normalizedQuery));
          })
        : filteredBySession;

      const usageTransactions = filteredTransactions.filter(
        (transaction) => transaction.creditsDelta < 0
      );
      const totalUsage = usageTransactions.reduce(
        (sum, transaction) => sum + Math.abs(transaction.creditsDelta),
        0
      );

      const usageByDate = new Map<string, number>();
      for (const transaction of usageTransactions) {
        const dateKey = toLocalDateKey(transaction.createdAt);
        usageByDate.set(
          dateKey,
          (usageByDate.get(dateKey) ?? 0) + Math.abs(transaction.creditsDelta)
        );
      }

      const daysCount = range === "7d" ? 7 : 30;
      const dailySeries: { dateStr: string; label: string; fullDate: string; value: number }[] =
        [];
      const now = new Date();

      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateKey = toLocalDateKey(d);
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const fullDate = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const value = usageByDate.get(dateKey) ?? 0;
        dailySeries.push({ dateStr: dateKey, label, fullDate, value });
      }

      const maxDailyValue = Math.max(...dailySeries.map((item) => item.value), 0);

      const typeMap = new Map<string, number>();
      for (const transaction of filteredTransactions) {
        typeMap.set(
          transaction.type,
          (typeMap.get(transaction.type) ?? 0) + transaction.creditsDelta
        );
      }

      const breakdown = Array.from(typeMap.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

      return {
        filteredTransactions,
        totalUsage,
        dailySeries,
        maxDailyValue,
        breakdown,
      };
    }, [query, range, selectedSessionId, transactions]);

  // 2. Stable 2-Week (14 Days) Model Telemetry
  const modelChartData = useMemo(() => {
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const recentTx = transactions.filter(
      (t) => new Date(t.createdAt).getTime() >= fourteenDaysAgo && t.creditsDelta < 0
    );

    const dates: string[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      dates.push(toLocalDateKey(d));
    }

    const modelDailyMap = new Map<string, Map<string, number>>();
    const modelTotals = new Map<string, number>();

    for (const t of recentTx) {
      const dateKey = toLocalDateKey(t.createdAt);
      const model =
        (t.sessionId ? sessionMap.get(t.sessionId)?.lastModel : null) ?? "Standard CLI";

      modelTotals.set(model, (modelTotals.get(model) ?? 0) + Math.abs(t.creditsDelta));

      if (!modelDailyMap.has(model)) {
        modelDailyMap.set(model, new Map());
      }
      const dayMap = modelDailyMap.get(model)!;
      dayMap.set(dateKey, (dayMap.get(dateKey) ?? 0) + Math.abs(t.creditsDelta));
    }

    const availableModels = Array.from(modelTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([model]) => model);

    return {
      availableModels,
      modelDailyMap,
      dates,
      dateLabels: dates.map((dStr) => {
        const [year, month, day] = dStr.split("-").map(Number);
        return new Date(year, month - 1, day).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }),
    };
  }, [transactions, sessionMap]);

  const currentActiveModels =
    activeModels.length > 0
      ? activeModels.filter((m) => modelChartData.availableModels.includes(m))
      : modelChartData.availableModels;

  // Format data specifically for Recharts Multi-Line
  const formattedMultiLineData = useMemo(() => {
    return modelChartData.dates.map((dateStr, idx) => {
      const row: Record<string, any> = {
        date: modelChartData.dateLabels[idx],
      };
      currentActiveModels.forEach((model) => {
        const dayMap = modelChartData.modelDailyMap.get(model);
        row[model] = dayMap?.get(dateStr) ?? 0;
      });
      return row;
    });
  }, [modelChartData, currentActiveModels]);

  const toggleModelFilter = (model: string) => {
    if (activeModels.includes(model)) {
      if (activeModels.length === 1) return;
      setActiveModels(activeModels.filter((m) => m !== model));
    } else {
      setActiveModels([...activeModels, model]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview & Filters Section */}
      <section className="rounded-xl border border-border/60 bg-card/40 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-display text-base font-semibold">Usage overview</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Track credit consumption over time, filtered by date range and session title.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Session Dropdown Filter */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/60 px-2.5 py-1">
              <Filter className="size-3.5 text-muted-foreground" />
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer max-w-[200px] truncate"
              >
                <option value="all" className="bg-background text-foreground">
                  All sessions
                </option>
                {availableSessions.map((s) => (
                  <option key={s.id} value={s.id} className="bg-background text-foreground">
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-background/60 p-1">
              {rangeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRange(option.value)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                    option.value === range
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          {/* Main Area Chart Container */}
          <div className="rounded-lg border border-border/50 bg-background/50 p-4">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Credits used in range</p>
                <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-foreground">
                  {formatCredits(totalUsage)}
                </p>
              </div>
              {maxDailyValue > 0 && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  Peak: {formatCredits(maxDailyValue)} / day
                </span>
              )}
            </div>

            <div className="h-44 w-full">
              {dailySeries.every((item) => item.value === 0) ? (
                <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border/50 text-xs text-muted-foreground">
                  No usage recorded for this filter criteria.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={dailySeries}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--border)"
                      strokeOpacity={0.4}
                    />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                      interval={range === "7d" ? 0 : 4}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                      domain={[0, "auto"]}
                    />
                    <Tooltip
                      content={<DailyTooltip />}
                      cursor={{
                        stroke: "var(--muted-foreground)",
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#usageGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Breakdown Card */}
          <div className="rounded-lg border border-border/50 bg-background/50 p-4">
            <p className="text-xs font-medium text-muted-foreground">Transaction breakdown</p>
            <div className="mt-4 space-y-2">
              {breakdown.length === 0 ? (
                <p className="text-xs text-muted-foreground">No transactions recorded.</p>
              ) : (
                breakdown.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs"
                  >
                    <span className="capitalize font-medium text-foreground">{item.label}</span>
                    <span
                      className={`font-mono font-bold ${
                        item.value < 0 ? "text-destructive" : "text-emerald-400"
                      }`}
                    >
                      {item.value > 0 ? "+" : ""}
                      {formatCredits(item.value)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Filterable Line Chart Section */}
      <section className="rounded-xl border border-border/60 bg-card/40 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-display text-base font-semibold flex items-center gap-2">
              <Cpu className="size-4 text-primary" /> Credits used per model
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Stable 14-day telemetry. Toggle model filters below to compare multiple models at once.
            </p>
          </div>

          {/* Model Filter Toggles */}
          <div className="flex flex-wrap items-center gap-1.5">
            {modelChartData.availableModels.map((model) => {
              const isSelected = currentActiveModels.includes(model);
              return (
                <button
                  key={model}
                  type="button"
                  onClick={() => toggleModelFilter(model)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono font-medium transition-all border ${
                    isSelected
                      ? "border-primary/50 bg-primary/10 text-primary shadow-xs"
                      : "border-border/60 bg-background/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isSelected && <Check className="size-3" />}
                  {model}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-border/50 bg-background/50 p-4">
          {currentActiveModels.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
              Select at least one model to display usage trends.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Custom Model Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs">
                {currentActiveModels.map((model, idx) => (
                  <div key={model} className="flex items-center gap-1.5">
                    <span
                      className="size-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          MODEL_HEX_COLORS[idx % MODEL_HEX_COLORS.length],
                      }}
                    />
                    <span className="font-mono font-medium text-foreground">{model}</span>
                  </div>
                ))}
              </div>

              {/* Responsive Multi-Line Chart */}
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formattedMultiLineData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--border)"
                      strokeOpacity={0.4}
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                      domain={[0, "auto"]}
                    />
                    <Tooltip content={<ModelTooltip />} />
                    {currentActiveModels.map((model, idx) => (
                      <Line
                        key={model}
                        type="monotone"
                        dataKey={model}
                        stroke={MODEL_HEX_COLORS[idx % MODEL_HEX_COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Transaction History Section */}
      <section className="rounded-xl border border-border/60 bg-card/40 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-display text-base font-semibold">Transaction history</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Search and filter recent dashboard credit usage logs.
            </p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search history..."
              className="h-9 w-full rounded-md border border-border/60 bg-background/60 pl-9 pr-3 text-xs outline-none ring-0 transition focus:border-primary"
            />
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="No transactions found"
              description="No credit usage matched your current filter criteria."
            />
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-lg border border-border/50 bg-background/50">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border/40 text-xs">
                <thead>
                  <tr className="bg-muted/20 text-left text-[11px] font-medium text-muted-foreground">
                    <th className="py-2.5 pl-4 pr-3">Description</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 pr-4 pl-3 text-right">Credits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredTransactions.map((transaction) => {
                    const isNegative = transaction.creditsDelta < 0;
                    const showExpiry = Boolean(
                      transaction.expiresAt &&
                        (transaction.type === "purchase" || transaction.type === "trial")
                    );

                    return (
                      <tr key={transaction.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 pl-4 pr-3">
                          <div>
                            <p className="font-semibold text-foreground">
                              {getTransactionTitle(transaction)}
                            </p>
                            <p className="font-mono text-[10px] text-muted-foreground">
                              {transaction.id}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                          <div>{formatDateTime(transaction.createdAt)}</div>
                          {showExpiry && (
                            <div
                              className={`text-[10px] ${
                                isExpiringSoon(transaction.expiresAt!)
                                  ? "text-amber-400 font-medium"
                                  : "text-muted-foreground/80"
                              }`}
                            >
                              Expires {formatDateTime(transaction.expiresAt!)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center rounded-md bg-muted/60 border border-border/60 px-2 py-0.5 text-[10px] font-mono uppercase font-medium text-muted-foreground">
                            {transaction.type}
                          </span>
                        </td>
                        <td className="py-3 pr-4 pl-3 text-right">
                          <span
                            className={`font-mono font-bold text-xs ${
                              isNegative ? "text-destructive" : "text-emerald-400"
                            }`}
                          >
                            {transaction.creditsDelta > 0 ? "+" : ""}
                            {formatCredits(transaction.creditsDelta)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}