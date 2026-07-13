import { Hono } from 'hono';
import { sentry } from "@sentry/hono/bun";
import * as Sentry from "@sentry/hono/bun";
import { HTTPException } from 'hono/http-exception';
import chat from "./routes/chat";
import auth from "./routes/auth";
import billing from "./routes/billing"

import sessions from "./routes/sessions"
import { requireAuth } from './middleware/require-auth';
const app = new Hono();

app.onError((error, c) => { //Doesnt catch our errors only standardizes the output
    if (error instanceof HTTPException) {
        return c.json({
            error: error.message || "Request failed" }, error.status);
    };
    
    console.error("Unhandled server error", error);
    return c.json({ error: "Internal server error"}, 500);
});

app.use("/sessions/*", requireAuth);
app.use("/chat/*", requireAuth);
app.use("/billing/portal", requireAuth);
app.use("/billing/checkout", requireAuth);

const routes = app
    .route("/auth", auth)
    .route("/billing", billing)
    .route("/sessions", sessions)
    .route("/chat", chat);

export type AppType = typeof routes;
// IdleTimeout must be high otherwise LLM tool calls will malfunction
export default { port: 3000, fetch: app.fetch, idleTimeout:225 };
