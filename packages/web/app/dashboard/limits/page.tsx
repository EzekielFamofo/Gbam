import { auth } from "@clerk/nextjs/server";
import { DashboardShell } from "../_components/dashboard-shell";
import { EmptyState } from "../_components/empty-state";
import { PermissionsForm } from "../_components/permissions-form";
import { getPermissions } from "@/lib/dashboard/get-permissions";
import { ShieldCheck } from "lucide-react";

export default async function DashboardPermissionsPage() {
  const { userId } = await auth();

  let permissionsData: Awaited<ReturnType<typeof getPermissions>> | null = null;
  let permissionsError: string | null = null;

  if (userId) {
    try {
      permissionsData = await getPermissions(userId);
    } catch (error) {
      permissionsError = error instanceof Error ? error.message : "Failed to load permissions";
    }
  }

  return (
    <DashboardShell currentPath="/dashboard/permissions">
      <div className="space-y-6">
        <section className="rounded-xl border border-border/60 bg-card/40 p-5">
          <div>
            <h3 className="font-display text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" /> Tool permissions
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Control what GBAM can do without asking you first. Protected paths like{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[11px]">.env</code> and{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[11px]">.git</code> always require
              confirmation, regardless of these settings.
            </p>
          </div>

          <div className="mt-6 rounded-lg border border-border/50 bg-background/50 p-5">
            {permissionsError || !permissionsData ? (
              <EmptyState
                title="Permissions unavailable"
                description={permissionsError ?? "Permission settings could not be loaded right now."}
              />
            ) : (
              <PermissionsForm
                initialRules={permissionsData.permissionConfig}
                isCustom={permissionsData.isCustom}
              />
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}