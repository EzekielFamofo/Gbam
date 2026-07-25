import { PermissionsForm } from "./permissions-form";
import type { PermissionRule } from "@gbam/shared";

interface DashboardPermissionsContentProps {
  permissionConfig: PermissionRule[];
  protectedPaths: string[];
  builtInProtectedPaths: string[];
  isCustom: boolean;
}

export function DashboardPermissionsContent({
  permissionConfig,
  protectedPaths,
  builtInProtectedPaths,
  isCustom,
}: DashboardPermissionsContentProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 md:py-10">
      <div className="flex flex-col items-start gap-4">
        <div className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-medium text-primary shadow-[0_0_0_1px_rgba(57,255,136,0.12),0_0_30px_rgba(57,255,136,0.12)]">
          🔒 Security & Control
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          CLI Permissions
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Control what GBAM can do on your machine without asking you first.
          {!isCustom && " You are currently running on the default secure ruleset."}
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-card/70 p-6 shadow-[0_18px_70px_rgba(0,0,0,0.22)] backdrop-blur md:p-8">
        <PermissionsForm
          initialRules={permissionConfig}
          initialProtectedPaths={protectedPaths}
          builtInProtectedPaths={builtInProtectedPaths}
          isCustom={isCustom}
        />
      </div>
    </div>
  );
}