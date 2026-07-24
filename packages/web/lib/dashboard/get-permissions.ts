import "server-only";
import { auth } from "@clerk/nextjs/server";
import type { PermissionRule } from "@gbam/shared";

function getInternalSecret() {
  return process.env.GBAM_INTERNAL_WEB_SECRET ??
    (process.env.NODE_ENV !== "production" ? "dev_gbam_dashboard_secret" : undefined);
}

export async function getPermissions(): Promise<{ permissionConfig: PermissionRule[]; isCustom: boolean }> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const internalSecret = getInternalSecret();
  if (!internalSecret) throw new Error("GBAM internal dashboard secret is not configured");

  const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.gbam.dev";

  const response = await fetch(`${apiUrl}/dashboard-permissions`, {
    headers: {
      "x-gbam-internal-secret": internalSecret,
      "x-gbam-user-id": userId,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "<no body>");
    console.error(
      `[get-permissions] ${apiUrl}/dashboard-permissions -> ${response.status} ${response.statusText}: ${body}`
    );
    throw new Error(`Unable to load permission settings (${response.status})`);
  }

  return response.json();
}