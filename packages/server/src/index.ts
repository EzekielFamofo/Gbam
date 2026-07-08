import { Hono } from 'hono';
import { sentry } from "@sentry/hono/bun";
import * as Sentry from "@sentry/hono/bun";
import { HTTPException } from 'hono/http-exception';
import chat from "./routes/chat"

import sessions from "./routes/sessions"
const app = new Hono();

app.use(
  sentry(app, { 
    dsn: "https://22f0dce0bfc59c37e7caed6ed1a1171d@o4511687908982784.ingest.us.sentry.io/4511687920582656",
    tracesSampleRate: 1.0,
    enableLogs: true,
    sendDefaultPii: true,
    }),
);

app.onError((error, c) => { //Doesnt catch our errors only standardizes the output
    if (error instanceof HTTPException) {
        Sentry.logger.warn("Handled HTTP error", {
            status: error.status,
            message: error.message || "Request failed",
            path: c.req.path,
            method: c.req.method,
        });

        return c.json({
            error: error.message || "Request failed" }, error.status);
    };
    
    Sentry.logger.error("Unhandled server error", {
        path: c.req.path,
        method: c.req.method,
        message: error instanceof Error ? error.message : "Unknown error",
    });

    return c.json({ error: "Internal sever error" }, 500);
});

const routes = app.route("/sessions", sessions).route("/chat", chat);

export type AppType = typeof routes;
// IdleTimeout must be high otherwise LLM tool calls will malfunction
export default { port: 3000, fetch: app.fetch, idleTimeout:225 };
