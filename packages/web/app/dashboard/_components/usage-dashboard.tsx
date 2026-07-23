"use client";

import { useMemo, useState } from "react";
import type { DashboardTransactionItem, DashboardSessionItem } from "@gbam/shared";
import { formatCredits, formatDateTime } from "@/lib/dashboard/format";
import { Search, Filter, Cpu, Check } from "lucide-react";
import { EmptyState } from "./empty-state";

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
  return transaction.description ?? "CLI usage";
}

const MODEL_COLORS = [
  { stroke: "stroke-primary", bg: "bg-primary", text: "text-primary" },
  { stroke: "stroke-emerald-400", bg: "bg-emerald-400", text: "text-emerald-400" },
  { stroke: "stroke-sky-400", bg: "bg-sky-400", text: "text-sky-400" },
  { stroke: "stroke-amber-400", bg: "bg-amber-400", text: "text-amber-400" },
  { stroke: "stroke-violet-400", bg: "bg-violet-400", text: "text-violet-400" },
];

type Props = {
  transactions: DashboardTransactionItem[];
  sessions?: DashboardSessionItem[];
};

export function UsageDashboard({ transactions, sessions = [] }: Props) {
  const [range, setRange] = useState<RangeValue>("30d");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [activeModels, setActiveModels] = useState<string[]>([]);

  // Map session IDs to their session objects for quick lookup
  const sessionMap = useMemo(() => {
    return new Map(sessions.map((s) => [s.id, s]));
  }, [sessions]);

  // Extract unique sessions for dropdown filter (displaying titles)
  const availableSessions = useMemo(() => {
    const sessionIds = Array.from(new Set(transactions.map((t) => t.sessionId).filter(Boolean))) as string[];
    return sessionIds.map((id) => {
      const session = sessionMap.get(id);
      return {
        id,
        title: session?.title ?? `Session ${id.slice(0, 8)}...`,
      };
    });
  }, [transactions, sessionMap]);

  // 1. Filtered Transactions for Bar Chart & History Table
  const { filteredTransactions, totalUsage, dailySeries, breakdown, maxDailyValue } = useMemo(() => {
    const cutoff = getCutoffDate(range);
    const normalizedQuery = query.trim().toLowerCase();

    const filteredByRange = transactions.filter((transaction) => {
      return new Date(transaction.createdAt).getTime() >= cutoff;
    });

    const filteredBySession = selectedSessionId === "all"
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

    const usageTransactions = filteredTransactions.filter((transaction) => transaction.creditsDelta < 0);
    const totalUsage = usageTransactions.reduce((sum, transaction) => sum + Math.abs(transaction.creditsDelta), 0);

    const usageByDate = new Map<string, number>();
    for (const transaction of usageTransactions) {
      const dateKey = new Date(transaction.createdAt).toISOString().split("T")[0];
      usageByDate.set(dateKey, (usageByDate.get(dateKey) ?? 0) + Math.abs(transaction.creditsDelta));
    }

    const daysCount = range === "7d" ? 7 : 30;
    const dailySeries: { dateStr: string; label: string; fullDate: string; value: number }[] = [];
    const now = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const fullDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const value = usageByDate.get(dateKey) ?? 0;
      dailySeries.push({ dateStr: dateKey, label, fullDate, value });
    }

    const maxDailyValue = Math.max(...dailySeries.map((item) => item.value), 0);

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
      dailySeries,
      maxDailyValue,
      breakdown,
    };
  }, [query, range, selectedSessionId, transactions]);

  // 2. Stable 2-Week (14 Days) Model Line Chart Data with Model Filtering
  const modelChartData = useMemo(() => {
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const recentTx = transactions.filter((t) => new Date(t.createdAt).getTime() >= fourteenDaysAgo && t.creditsDelta < 0);

    const dates: string[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }

    const modelDailyMap = new Map<string, Map<string, number>>();
    const modelTotals = new Map<string, number>();

    for (const t of recentTx) {
      const dateKey = new Date(t.createdAt).toISOString().split("T")[0];
      const model = (t.sessionId ? sessionMap.get(t.sessionId)?.lastModel : null) ?? "Standard CLI";

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
      dateLabels: dates.map((dStr) => new Date(dStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })),
    };
  }, [transactions, sessionMap]);

  // Initialize active models if empty
  const currentActiveModels = activeModels.length > 0 
    ? activeModels.filter(m => modelChartData.availableModels.includes(m))
    : modelChartData.availableModels;

  const filteredModelSeries = useMemo(() => {
    const modelsToRender = currentActiveModels.length > 0 ? currentActiveModels : modelChartData.availableModels;
    
    let globalMax = 1;
    const series = modelsToRender.map((model, idx) => {
      const dayMap = modelDailyMapGet(model, modelChartData.modelDailyMap);
      const points = modelChartData.dates.map((dateStr) => dayMap.get(dateStr) ?? 0);
      const localMax = Math.max(...points, 0);
      if (localMax > globalMax) globalMax = localMax;

      return {
        model,
        points,
        color: MODEL_COLORS[idx % MODEL_COLORS.length]!,
      };
    });

    return { series, maxValue: globalMax };
  }, [currentActiveModels, modelChartData]);

  function modelDailyMapGet(model: string, map: Map<string, Map<string, number>>) {
    return map.get(model) || new Map<string, number>();
  }

  const toggleModelFilter = (model: string) => {
    if (activeModels.includes(model)) {
      if (activeModels.length === 1) return; // Keep at least one selected
      setActiveModels(activeModels.filter((m) => m !== model));
    } else {
      setActiveModels([...activeModels, model]);
    }
  };

  const labelInterval = range === "7d" ? 1 : 5;

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
            {/* Session Dropdown Filter (Filtered by Title) */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/60 px-2.5 py-1">
              <Filter className="size-3.5 text-muted-foreground" />
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer max-w-[200px] truncate"
              >
                <option value="all" className="bg-background text-foreground">All sessions</option>
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
          {/* Vertical Bar Chart Box with Visible Overflow for Tooltips */}
          <div className="rounded-lg border border-border/50 bg-background/50 p-4 overflow-visible">
            <div className="flex items-baseline justify-between">
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

            <div className="mt-6">
              {dailySeries.every((item) => item.value === 0) ? (
                <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-border/50 text-xs text-muted-foreground">
                  No usage recorded for this filter criteria.
                </div>
              ) : (
                <div className="overflow-x-auto overflow-y-visible pb-2">
                  <div className="min-w-[580px] space-y-2">
                    <div className="relative flex h-40 items-end gap-2 pt-10 border-b border-border/60">
                      <div className="pointer-events-none absolute inset-x-0 top-8 border-b border-dashed border-border/20" />
                      <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed border-border/20" />

                      {dailySeries.map((item) => {
                        const heightPercent = maxDailyValue > 0 ? (item.value / maxDailyValue) * 100 : 0;
                        return (
                          <div
                            key={item.dateStr}
                            className="group relative flex flex-1 flex-col items-center h-full justify-end cursor-pointer"
                          >
                            <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 z-30 hidden rounded-md border border-border/80 bg-popover px-2.5 py-1 text-[11px] font-mono text-popover-foreground shadow-xl group-hover:flex whitespace-nowrap items-center gap-1.5">
                              <span className="text-muted-foreground">{item.fullDate}:</span>
                              <span className="font-bold text-primary">{formatCredits(item.value)} credits</span>
                            </div>
                            <div
                              className={`w-full rounded-t-xs transition-all duration-200 ${
                                item.value > 0
                                  ? "bg-primary group-hover:bg-primary/80"
                                  : "bg-muted/30 group-hover:bg-muted/60"
                              }`}
                              style={{
                                height: item.value > 0 ? `${Math.max(heightPercent, 4)}%` : "2px",
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between text-[10px] font-mono text-muted-foreground px-0.5">
                      {dailySeries.map((item, index) => {
                        const showLabel = index % labelInterval === 0 || index === dailySeries.length - 1;
                        return (
                          <span key={item.dateStr} className={`text-center flex-1 ${showLabel ? "block" : "invisible"}`}>
                            {item.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
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
                    <span className="font-mono font-bold text-foreground">{formatCredits(item.value)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Filterable Line Chart Section: Credits Used Per Model */}
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
          {filteredModelSeries.series.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
              Select at least one model to display usage trends.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs">
                {filteredModelSeries.series.map((s) => (
                  <div key={s.model} className="flex items-center gap-1.5">
                    <span className={`size-2.5 rounded-full ${s.color.bg}`} />
                    <span className="font-mono font-medium text-foreground">{s.model}</span>
                  </div>
                ))}
              </div>

              {/* SVG Multi-Line Chart Canvas with Thinner Lines */}
              <div className="relative h-48 w-full pt-4">
                <div className="pointer-events-none absolute inset-x-0 top-0 border-b border-dashed border-border/20" />
                <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed border-border/20" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 border-b border-border/60" />

                <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                  {filteredModelSeries.series.map((s) => {
                    const pointsCount = s.points.length;
                    const pathCoords = s.points
                      .map((val, idx) => {
                        const x = (idx / (pointsCount - 1 || 1)) * 100;
                        const y = 100 - (val / filteredModelSeries.maxValue) * 85 - 5;
                        return `${x},${y}`;
                      })
                      .join(" ");

                    return (
                      <polyline
                        key={s.model}
                        fill="none"
                        className={`${s.color.stroke} transition-all duration-300`}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={pathCoords}
                      />
                    );
                  })}
                </svg>
              </div>

              {/* X-Axis Date Labels */}
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground px-1 pt-1">
                <span>{modelChartData.dateLabels[0]}</span>
                <span>{modelChartData.dateLabels[Math.floor(modelChartData.dateLabels.length / 2)]}</span>
                <span>{modelChartData.dateLabels[modelChartData.dateLabels.length - 1]}</span>
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
                    return (
                      <tr key={transaction.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 pl-4 pr-3">
                          <div>
                            <p className="font-semibold text-foreground">{getTransactionTitle(transaction)}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{transaction.id}</p>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                          {formatDateTime(transaction.createdAt)}
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