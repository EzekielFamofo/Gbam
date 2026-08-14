let cachedRate: { value: number; timestamp: number } | null = null;
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const DEFAULT_FALLBACK_RATE = 1400;

type ErApiResponse = {
    rates?: Record<string, number>;
};

/**
 * Fetches the live USD to NGN exchange rate from open.er-api.com.
 * Caches the result in memory for 12 hours.
 */
export async function getUsdToNgnRate(): Promise<number> {
    const now = Date.now();

    // 1. Return cached rate if still valid
    if (cachedRate && now - cachedRate.timestamp < CACHE_TTL_MS) {
        return cachedRate.value;
    }

    try {
        const response = await fetch("https://open.er-api.com/v6/latest/USD");
        if (!response.ok) {
            throw new Error(`API responded with HTTP ${response.status}`);
        }

        const data = (await response.json()) as ErApiResponse;
        const liveNgnRate = data?.rates?.NGN;

        if (typeof liveNgnRate === "number" && liveNgnRate > 0) {
            cachedRate = { value: liveNgnRate, timestamp: now };
            console.log(`[FX] Live USD/NGN rate updated: ₦${liveNgnRate}`);
            return liveNgnRate;
        }
    } catch (error) {
        console.error("[FX ERROR] Failed to fetch exchange rate, using fallback:", error);
    }

    // 2. Fallback to cached rate or default static rate
    return cachedRate?.value ?? DEFAULT_FALLBACK_RATE;
}