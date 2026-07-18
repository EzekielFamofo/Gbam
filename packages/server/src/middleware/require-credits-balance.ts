import { createMiddleware } from "hono/factory";
import type { AuthenticatedEnv } from "./require-auth";
import { getAvailableCreditsBalance } from "../lib/polar";

export const requireCreditsBalance = createMiddleware<AuthenticatedEnv>(async (c, next) => {
    const userId = c.get("userId");

    if (!userId) {
        console.error("🚨 requireCreditsBalance ran before userId was set — check middleware order");
        return c.json({ error: "Unauthorized" }, 401);
    }
    try {
        const creditsBalance = await getAvailableCreditsBalance(userId);

        // This is a simple launch-time gate: only start new work when the customer
        // still has credits left. It does not reserve the full eventual cost of the
        // request, so low-volume apps may tolerate small overspend on edge case.
        if (creditsBalance <= 0) {
            return c.json({ error: "No credits remaining. Run /upgrade to buy more credits."}, 402);
        }

        await next();
    } catch (error) {
        console.error("🚨 Credit Verification Crash Error:", error);
        
        return c.json({ error: "Unable to verify credits balance right now"}, 503)
    }
});