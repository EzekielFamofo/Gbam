"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

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

    // Auto-dismiss the success message after 3 seconds
    useEffect(() => {
        if (saved) {
            const timer = setTimeout(() => setSaved(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [saved]);

    function handleSave() {
        setError(null);
        setSaved(false);

        const dailyValue = daily.trim() === "" ? null : Number(daily);
        const monthlyValue = monthly.trim() === "" ? null : Number(monthly);

        if (dailyValue != null && monthlyValue != null && dailyValue > monthlyValue) {
            setError("Daily limit can't exceed the monthly limit.");
            return;
        }

        startTransition(async () => {
            try {
                const res = await fetch("/api/dashboard/limits", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        dailySpendLimit: dailyValue,
                        monthlySpendLimit: monthlyValue,
                    }),
                });

                if (!res.ok) {
                    setError("Failed to save spend limits.");
                    return;
                }

                setSaved(true);
            } catch {
                setError("An unexpected error occurred.");
            }
        });
    }

    return (
        <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-xs">
                    <span className="font-medium text-foreground">Daily limit (credits)</span>
                    <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={daily}
                        onChange={(e) => setDaily(e.target.value)}
                        placeholder="No limit"
                        className="w-full rounded-md border border-border/60 bg-background/60 px-3 py-2 text-xs text-foreground outline-none ring-0 transition focus:border-primary"
                    />
                    <span className="block text-[11px] text-muted-foreground">
                        {initialData.dailySpent} used today
                        {initialData.dailySpendLimit != null ? ` of ${initialData.dailySpendLimit}` : ""}
                    </span>
                </label>

                <label className="space-y-1.5 text-xs">
                    <span className="font-medium text-foreground">Monthly limit (credits)</span>
                    <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={monthly}
                        onChange={(e) => setMonthly(e.target.value)}
                        placeholder="No limit"
                        className="w-full rounded-md border border-border/60 bg-background/60 px-3 py-2 text-xs text-foreground outline-none ring-0 transition focus:border-primary"
                    />
                    <span className="block text-[11px] text-muted-foreground">
                        {initialData.monthlySpent} used this month
                        {initialData.monthlySpendLimit != null ? ` of ${initialData.monthlySpendLimit}` : ""}
                    </span>
                </label>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive animate-in fade-in duration-200">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {saved && (
                <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400 animate-in fade-in duration-200">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>Spend limits updated successfully.</span>
                </div>
            )}

            <div className="flex items-center justify-end pt-2">
                <Button 
                    size="sm" 
                    onClick={handleSave} 
                    disabled={isPending}
                    className="cursor-pointer"
                >
                    {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
                    {isPending ? "Saving..." : "Save limits"}
                </Button>
            </div>
        </div>
    );
}