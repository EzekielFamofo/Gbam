import "server-only";
import { fetchInternalApi } from "./internal-api";
import type { PermissionRule } from "@gbam/shared";

export type PermissionsData = {
  permissionConfig: PermissionRule[];
  isCustom: boolean;
};

export async function getPermissions(userId: string): Promise<PermissionsData> {
  const response = await fetchInternalApi("/dashboard-permissions", userId);

  if (!response.ok) {
    const body = await response.text().catch(() => "<no body>");
    console.error(`[get-permissions] /dashboard-permissions -> ${response.status}: ${body}`);
    throw new Error(`Unable to load permission settings (${response.status})`);
  }

  return response.json();
}