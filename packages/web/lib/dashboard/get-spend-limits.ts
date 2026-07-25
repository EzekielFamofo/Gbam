import "server-only";
import { fetchInternalApi } from "./internal-api";

export type SpendLimitsData = {
  dailySpendLimit: number | null;
  monthlySpendLimit: number | null;
  dailySpent: number;
  monthlySpent: number;
};

export async function getSpendLimits(userId: string): Promise<SpendLimitsData> {
  const response = await fetchInternalApi("/dashboard-limits", userId);
  if (!response.ok) throw new Error(`Failed to load spend limits (${response.status})`);
  return response.json();
}