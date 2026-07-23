export type SpendLimitsData = {
  dailySpendLimit: number | null;
  monthlySpendLimit: number | null;
  dailySpent: number;
  monthlySpent: number;
};

function getInternalSecret() {
  return process.env.GBAM_INTERNAL_WEB_SECRET ??
    (process.env.NODE_ENV !== "production" ? "dev_gbam_dashboard_secret" : undefined);
}

export async function getSpendLimits(userId: string): Promise<SpendLimitsData> {
  const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.gbam.dev";
  const internalSecret = getInternalSecret();

  if (!internalSecret) {
    throw new Error("GBAM_INTERNAL_WEB_SECRET is not configured");
  }

  const response = await fetch(`${apiUrl}/dashboard-limits`, {
    method: "GET",
    headers: {
      "x-gbam-internal-secret": internalSecret,
      "x-gbam-user-id": userId,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load spend limits (${response.status})`);
  }

  return response.json() as Promise<SpendLimitsData>;
}