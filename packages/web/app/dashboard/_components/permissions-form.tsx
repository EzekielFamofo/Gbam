"use client";

import { useState, useTransition } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
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

const ACTION_STYLES: Record<PermissionAction, string> = {
  allow: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  ask: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  deny: "text-red-400 border-red-500/30 bg-red-500/10",
};

export function PermissionsForm({
  initialRules,
  isCustom,
}: {
  initialRules: PermissionRule[];
  isCustom: boolean;
}) {
  const [rules, setRules] = useState<PermissionRule[]>(initialRules);
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

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/dashboard/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionConfig: rules }),
      });
      if (!res.ok) return setError("Couldn't save your permissions. Try again.");
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
        body: JSON.stringify({ permissionConfig: null }),
      });
      if (!res.ok) return setError("Couldn't reset your permissions. Try again.");
      setRules(DEFAULT_PERMISSION_RULES);
      setIsCustomState(false);
      setSaved(true);
    });
  }

  return (
    <div className="space-y-6">
      {/* List Container matching the nested cards from the Home page */}
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

              <div className="relative">
                <select
                  className={cn(
                    "cursor-pointer appearance-none rounded-md border px-4 py-2 pr-8 text-xs font-semibold capitalize outline-none transition-colors",
                    ACTION_STYLES[action]
                  )}
                  value={action}
                  onChange={(e) => updateAction(category, e.target.value as PermissionAction)}
                >
                  {ACTIONS.map((a) => (
                    <option key={a} value={a} className="bg-background text-foreground">
                      {a}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 opacity-60" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-4">
          <Button 
            size="lg" 
            onClick={handleSave} 
            disabled={isPending}
            className="font-semibold shadow-sm"
          >
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