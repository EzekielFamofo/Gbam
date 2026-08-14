import { Hono } from "hono";
import { checkPriceDrift } from "../services/drift-check";

const app = new Hono();

app.post("/", async (c) => {
    const secret = c.req.header("x-cron-secret");
    if (secret !== process.env.CRON_SECRET) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    try {
        const driftAlerts = await checkPriceDrift();
        return c.json({
            success: true,
            driftCount: driftAlerts.length,
            driftAlerts,
        });
    } catch (error) {
        console.error("[CRON ERROR] OpenRouter price drift detection failed:", error);
        return c.json({ error: "Failed to execute drift detection" }, 500);
    }
});

export default app;