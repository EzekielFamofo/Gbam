import { auth } from "@clerk/nextjs/server";
import { DashboardShell } from "../_components/dashboard-shell";
import { DashboardUnavailable } from "../_components/dashboard-header";
import { getPermissions } from "@/lib/dashboard/get-permissions";
import { DashboardPermissionsContent } from "../_components/dashboard-permissions-content";


export default async function DashboardPermissionsPage() {
  const { userId } = await auth();

  let permissionsData = null;
  let dashboardError: string | null = null;

  if (userId) {
    try {
      permissionsData = await getPermissions(userId);
    } catch (error) {
      dashboardError = error instanceof Error ? error.message : "Failed to load permissions";
    }
  }

  return (
    <DashboardShell currentPath="/dashboard/permissions">
      {!userId ? (
        <DashboardUnavailable message="You need to be logged in to view and configure your permissions." />
      ) : dashboardError || !permissionsData ? (
        <DashboardUnavailable message={dashboardError ?? "The permissions data could not be loaded right now."} />
      ) : (
        <DashboardPermissionsContent 
          permissionConfig={permissionsData.permissionConfig}
          isCustom={permissionsData.isCustom}
        />
      )}
    </DashboardShell>
  );
}