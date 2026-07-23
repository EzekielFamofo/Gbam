import type { Context, Next } from "hono";
import type { AuthenticatedEnv } from "./require-auth";
import { getSpendLimitsData } from "../lib/spend-limits";

/**
 * Blocks a request if the user has configured a daily or monthly spending
 * limit and has already used that much (or more) in the current window.
 *
 * Like requireCreditsBalance, this only stops new requests from starting
 * once the limit is already hit - it doesn't cut a response off mid-stream,
 * since usage for the current request isn't recorded until it finishes.
 */
export async function requireSpendLimit(c: Context<AuthenticatedEnv>, next: Next) {
    const userId = c.get("userId");
    const { dailySpendLimit, monthlySpendLimit, dailySpent, monthlySpent } =
        await getSpendLimitsData(userId);

    if (dailySpendLimit == null && monthlySpendLimit == null) {
        return next();
    }

    if (dailySpendLimit != null && dailySpent >= dailySpendLimit) {
        return c.json(
            { error: "Daily spending limit reached", period: "daily", limit: dailySpendLimit, spent: dailySpent },
            402,
        );
    }

    if (monthlySpendLimit != null && monthlySpent >= monthlySpendLimit) {
        return c.json(
            { error: "Monthly spending limit reached", period: "monthly", limit: monthlySpendLimit, spent: monthlySpent },
            402,
        );
    }

    return next();
}