"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type SpendLimitsFormProps = {
    initialData: {
        dailySpendLimit: number | null;
        monthlySpendLimit: number | null;
        dailySpent: number;
        monthlySpent: number;
    };
};

export function SpendLimitsForm({ initialData }: SpendLimitsFormProps) {
    const [daily, setDaily] = useState(initialData.dailySpendLimit?.toString() ?? "");
    const [monthly, setMonthly] = useState(initialData.monthlySpendLimit?.toString() ?? "");
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const [isPending, startTransition] = useTransition();

    function handleSave() {
        setError(null);
        setSaved(false);

        const dailyValue = daily.trim() === "" ? null : Number(daily);
        const monthlyValue = monthly.trim() === "" ? null : Number(monthly);

        if (dailyValue != null && monthlyValue != null && dailyValue > monthlyValue) {
            setError("Daily limit can't exceed the monthly limit");
            return;
        }

        startTransition(async () => {
            const res = await fetch("/api/dashboard/limits", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dailySpendLimit: dailyValue,
                    monthlySpendLimit: monthlyValue,
                }),
            });

            if (!res.ok) {
                setError("Failed to save spend limits");
                return;
            }

            setSaved(true);
        });
    }

    return (
        <section className="rounded-3xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-semibold">Spending limits</h2>
            <p className="mt-1 text-sm text-muted-foreground">
                Cap how many credits your sessions can use per day or per month. Leave a field blank for no limit.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm">
                    <span className="font-medium">Daily limit (credits)</span>
                    <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={daily}
                        onChange={(e) => setDaily(e.target.value)}
                        placeholder="No limit"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                    <span className="block text-xs text-muted-foreground">
                        {initialData.dailySpent} used today
                        {initialData.dailySpendLimit != null ? ` of ${initialData.dailySpendLimit}` : ""}
                    </span>
                </label>

                <label className="space-y-1.5 text-sm">
                    <span className="font-medium">Monthly limit (credits)</span>
                    <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={monthly}
                        onChange={(e) => setMonthly(e.target.value)}
                        placeholder="No limit"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                    <span className="block text-xs text-muted-foreground">
                        {initialData.monthlySpent} used this month
                        {initialData.monthlySpendLimit != null ? ` of ${initialData.monthlySpendLimit}` : ""}
                    </span>
                </label>
            </div>

            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            {saved && !error && <p className="mt-3 text-sm text-primary">Saved.</p>}

            <Button className="mt-4" onClick={handleSave} disabled={isPending}>
                {isPending ? "Saving..." : "Save limits"}
            </Button>
        </section>
    );
}