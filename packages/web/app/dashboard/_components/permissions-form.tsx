"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { PermissionAction, PermissionRule, ToolCategory } from "@gbam/shared";

const CATEGORIES: ToolCategory[] = ["read", "list", "glob", "grep", "edit", "bash", "webfetch"];
const ACTIONS: PermissionAction[] = ["allow", "ask", "deny"];

export function PermissionsForm({ initialRules }: { initialRules: PermissionRule[] }) {
  const [rules, setRules] = useState<PermissionRule[]>(initialRules);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function getAction(category: ToolCategory): PermissionAction {
    // Mirrors resolvePermission's last-match-wins evaluation
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
      setSaved(true);
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border divide-y">
        {CATEGORIES.map((category) => (
          <div key={category} className="flex items-center justify-between px-4 py-3">
            <span className="font-mono text-sm capitalize">{category}</span>
            <select
              className="rounded-md border bg-background px-2 py-1 text-sm"
              value={getAction(category)}
              onChange={(e) => updateAction(category, e.target.value as PermissionAction)}
            >
              {ACTIONS.map((action) => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save changes"}
        </Button>
        {saved && <span className="text-sm text-muted-foreground">Saved.</span>}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </div>
  );
}