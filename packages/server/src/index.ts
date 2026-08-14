import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import cron from "node-cron";

// Route imports
import auth from "./routes/auth";
import billing from "./routes/billing";
import chat from "./routes/chat";
import dashboard from "./routes/dashboard";
import dashboardBilling from "./routes/dashboard-billing";
import dashboardSessions from "./routes/dashboard-sessions";
import sessions from "./routes/sessions";
import dashboardLimits from "./routes/dashboard-limits";
import dashboardPermissions from "./routes/dashboard-permissions"; 
import permissions from "./routes/permissions";
import ExpiredCreditsSweep from "./routes/internal-credits-expiry";
import ModelPricesSync from "./routes/internal-sync-models";

// Service imports (assuming you extracted the check logic into a helper file)
import { checkPriceDrift } from "./services/drift-check";

// Middleware imports
import { requireAuth } from "./middleware/require-auth";

const app = new Hono();

const allowedOrigins = [
    "https://gbam.dev",
    "https://www.gbam.dev",
    "http://localhost:3000",
    "http://localhost:3001",
];

// Logging Middleware
app.use("*", async (c, next) => {
    console.log(`[BACKEND LOG] ${c.req.method} ${c.req.path}`);
    await next();
});

// CORS Configuration
app.use(
    "/*",
    cors({
        origin: allowedOrigins,
        allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        exposeHeaders: ["Content-Length"],
        maxAge: 600,
    })
);

// Global Error Handler with explicit CORS fallback
app.onError((error, c) => {
    const origin = c.req.header("Origin");
    if (origin && allowedOrigins.includes(origin)) {
        c.header("Access-Control-Allow-Origin", origin);
    }
    c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

    if (error instanceof HTTPException) {
        return c.json({ error: error.message || "Request failed" }, error.status);
    }

    console.error("Unhandled server error:", error);
    return c.json({ error: "Internal server error" }, 500);
});

// Protected middleware routes
app.use("/billing/portal", requireAuth);
app.use("/billing/checkout", requireAuth);

// Route Chaining (enables type-safe RPC with Hono client)
const routes = app
    .route("/auth", auth)
    .route("/billing", billing)
    .route("/dashboard", dashboard)
    .route("/dashboard-billing", dashboardBilling)
    .route("/dashboard-sessions", dashboardSessions)
    .route("/sessions", sessions)
    .route("/chat", chat)
    .route("/dashboard-limits", dashboardLimits)
    .route("/dashboard-permissions", dashboardPermissions) 
    .route("/permissions", permissions)
    .route("/internal/credit-expiry", ExpiredCreditsSweep)
    .route("/internal/sync-models", ModelPricesSync);

export type AppType = typeof routes;

// Export underlying lib models and execution helpers for monorepo consumption
export * from "./lib/models";


cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Executing daily OpenRouter price drift check...");
    try {
        await checkPriceDrift();
    } catch (error) {
        console.error("[CRON ERROR] Daily price drift check failed:", error);
    }
});

const port = Number(process.env.PORT) || 3001;

export default { 
    port, 
    fetch: app.fetch, 
    idleTimeout: 225 
};