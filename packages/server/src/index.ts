import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import chat from "./routes/chat";
import auth from "./routes/auth";
import billing from "./routes/billing";
import sessions from "./routes/sessions";
import { requireAuth } from './middleware/require-auth';

const app = new Hono();

// 1. Configure CORS with explicit header permissions
app.use(
  "/*",
  cors({
    origin: "*", // In production, change this to your specific frontend URL!
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

// 2. Global Error Handler
app.onError((error, c) => {
    // 🚨 CRITICAL CORS FIX: Ensure error responses have CORS headers.
    // Otherwise, 401 Unauthorized or 500 crashes will be masked as "CORS errors" in the browser!
    c.header("Access-Control-Allow-Origin", "*");
    c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

    if (error instanceof HTTPException) {
        return c.json({
            error: error.message || "Request failed" 
        }, error.status);
    }
    
    console.error("Unhandled server error:", error);
    return c.json({ error: "Internal server error" }, 500);
});

// 3. Apply Auth protection
app.use("/sessions/*", requireAuth);
app.use("/chat/*", requireAuth);
app.use("/billing/portal", requireAuth);
app.use("/billing/checkout", requireAuth);

// 4. Register Routes
const routes = app
    .route("/auth", auth)
    .route("/billing", billing)
    .route("/sessions", sessions)
    .route("/chat", chat);

export type AppType = typeof routes;

// IdleTimeout must be high otherwise LLM tool calls will malfunction
export default { port: 3000, fetch: app.fetch, idleTimeout: 225 };