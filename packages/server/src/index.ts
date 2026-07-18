import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import chat from "./routes/chat";
import auth from "./routes/auth";
import billing from "./routes/billing";
import sessions from "./routes/sessions";
import { requireAuth } from './middleware/require-auth';

const app = new Hono();

const allowedOrigins = [
  "https://gbam.dev",
  "https://www.gbam.dev",
  "http://localhost:3000",
   "http://localhost:3001"
];

// 1. Global Debug Logger (Ensures you see exactly what paths are hitting this server)
app.use("*", async (c, next) => {
  console.log(`[BACKEND LOG] ${c.req.method} ${c.req.path}`);
  await next();
});

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

// 2. Fixed Wildcards: Using * instead of /* ensures the base path is also protected
app.use("/billing/portal", requireAuth);
app.use("/billing/checkout", requireAuth);

// 3. Register Routes (If your frontend hits /api/chat, change "/chat" below to "/api/chat")
const routes = app
    .route("/auth", auth)
    .route("/billing", billing)
    .route("/sessions", sessions)
    .route("/chat", chat); 

export type AppType = typeof routes;

const port = Number(process.env.PORT) || 3001; // Railway injects PORT in prod; 3001 is just your local fallback

export default { port, fetch: app.fetch, idleTimeout: 225 };