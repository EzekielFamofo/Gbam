"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Lock, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEFAULT_PERMISSION_RULES, type PermissionAction, type PermissionRule, type ToolCategory } from "@gbam/shared";

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  read: "Read files",
  list: "List directories",
  glob: "Glob search",
  grep: "Grep search",
  edit: "Edit / write files",
  bash: "Run bash commands",
  webfetch: "Fetch URLs",
  "*": "Everything else",
};

const CATEGORIES: ToolCategory[] = ["read", "list", "glob", "grep", "edit", "bash", "webfetch"];
const ACTIONS: PermissionAction[] = ["allow", "ask", "deny"];

const ACTION_STYLES: Record<PermissionAction, { pill: string; dot: string }> = {
  allow: { pill: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10 focus-visible:ring-emerald-500/40", dot: "bg-emerald-400" },
  ask: { pill: "text-amber-400 border-amber-500/30 bg-amber-500/10 focus-visible:ring-amber-500/40", dot: "bg-amber-400" },
  deny: { pill: "text-red-400 border-red-500/30 bg-red-500/10 focus-visible:ring-red-500/40", dot: "bg-red-400" },
};

function ActionSelect({
  value,
  onChange,
}: {
  value: PermissionAction;
  onChange: (action: PermissionAction) => void;
}) {
  const style = ACTION_STYLES[value];
  return (
    <div className="relative w-28 shrink-0">
      <span className={cn("pointer-events-none absolute left-3 top-1/2 size-1.5 -translate-y-1/2 rounded-full", style.dot)} />
      <select
        className={cn(
          "w-full cursor-pointer appearance-none rounded-full border py-2 pl-6 pr-8 text-xs font-semibold capitalize outline-none transition-all",
          "focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          style.pill
        )}
        value={value}
        onChange={(e) => onChange(e.target.value as PermissionAction)}
      >
        {ACTIONS.map((a) => (
          <option key={a} value={a} className="bg-background text-foreground">
            {a}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 opacity-60" />
    </div>
  );
}

export function PermissionsForm({
  initialRules,
  initialProtectedPaths,
  builtInProtectedPaths,
  isCustom,
}: {
  initialRules: PermissionRule[];
  initialProtectedPaths: string[];
  builtInProtectedPaths: string[];
  isCustom: boolean;
}) {
  const [rules, setRules] = useState<PermissionRule[]>(initialRules);
  const [protectedPaths, setProtectedPaths] = useState<string[]>(initialProtectedPaths);
  const [isCustomState, setIsCustomState] = useState(isCustom);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function getAction(category: ToolCategory): PermissionAction {
    for (let i = rules.length - 1; i >= 0; i--) {
      const rule = rules[i];
      if (!rule.pattern && (rule.category === category || rule.category === "*")) return rule.action;
    }
    return "ask";
  }

  function updateAction(category: ToolCategory, action: PermissionAction) {
    setSaved(false);
    setRules((prev) => {
      const existing = prev.find((r) => r.category === category && !r.pattern);
      return existing
        ? prev.map((r) => (r === existing ? { ...r, action } : r))
        : [...prev, { category, action }];
    });
  }

  function addProtectedPath() {
    setSaved(false);
    setProtectedPaths((prev) => [...prev, ""]);
  }

  function updateProtectedPath(index: number, value: string) {
    setSaved(false);
    setProtectedPaths((prev) => prev.map((p, i) => (i === index ? value : p)));
  }

  function removeProtectedPath(index: number) {
    setSaved(false);
    setProtectedPaths((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    setError(null);
    const cleanedPaths = Array.from(
      new Set(protectedPaths.map((p) => p.trim()).filter((p) => p.length > 0)),
    );

    startTransition(async () => {
      const res = await fetch("/api/dashboard/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionConfig: rules, protectedPaths: cleanedPaths }),
      });
      if (!res.ok) return setError("Couldn't save your permissions. Try again.");
      setProtectedPaths(cleanedPaths);
      setIsCustomState(true);
      setSaved(true);
    });
  }

  function handleReset() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/dashboard/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionConfig: null, protectedPaths: null }),
      });
      if (!res.ok) return setError("Couldn't reset your permissions. Try again.");
      setRules(DEFAULT_PERMISSION_RULES);
      setProtectedPaths([]);
      setIsCustomState(false);
      setSaved(true);
    });
  }

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-2xl border border-border bg-background/60 divide-y divide-border/60">
        {CATEGORIES.map((category) => {
          const action = getAction(category);
          return (
            <div
              key={category}
              className="flex items-center justify-between gap-4 p-5 transition-colors hover:bg-muted/30"
            >
              <div>
                <p className="text-base font-medium">{CATEGORY_LABELS[category]}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{category}</p>
              </div>
              <ActionSelect value={action} onChange={(a) => updateAction(category, a)} />
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <Lock className="size-3.5 text-primary" /> Protected paths
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            GBAM always asks before touching these, no matter what's set above. The built-in list can't be
            removed; add your own below.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {builtInProtectedPaths.map((path) => (
            <span
              key={path}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 font-mono text-[11px] text-muted-foreground"
            >
              <Lock className="size-3" /> {path}
            </span>
          ))}
        </div>

        <div className="space-y-2">
          {protectedPaths.map((path, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={path}
                onChange={(e) => updateProtectedPath(index, e.target.value)}
                placeholder="e.g. **/secrets/**"
                className="flex-1 rounded-lg border border-border/60 bg-background/50 px-3 py-2 font-mono text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40"
              />
              <button
                type="button"
                onClick={() => removeProtectedPath(index)}
                className="rounded-lg border border-border/60 p-2 text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-400"
                aria-label="Remove protected path"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={addProtectedPath}
          >
            <Plus className="size-3.5" /> Add protected path
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-4">
          <Button size="lg" onClick={handleSave} disabled={isPending} className="font-semibold shadow-sm">
            {isPending ? "Saving..." : "Save changes"}
          </Button>
          {isCustomState && (
            <Button
              size="default"
              variant="ghost"
              className="gap-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={handleReset}
              disabled={isPending}
            >
              <RotateCcw className="size-4" /> Reset to defaults
            </Button>
          )}
        </div>
        <div className="text-sm font-medium">
          {saved && <span className="text-emerald-400">Successfully saved</span>}
          {error && <span className="text-red-400">{error}</span>}
        </div>
      </div>
    </div>
  );
}