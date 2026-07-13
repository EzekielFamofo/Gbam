import { Hono } from 'hono';
import { sentry } from "@sentry/hono/bun";
import * as Sentry from "@sentry/hono/bun";
import { HTTPException } from 'hono/http-exception';
import chat from "./routes/chat";
import auth from "./routes/auth"

import sessions from "./routes/sessions"
import { requireAuth } from './middleware/require-auth';
const app = new Hono();

app.use("/sessions/*", requireAuth);
app.use("/chat/*", requireAuth);

const routes = app
    .route("/auth", auth)
    .route("/sessions", sessions)
    .route("/chat", chat);

export type AppType = typeof routes;
// IdleTimeout must be high otherwise LLM tool calls will malfunction
export default { port: 3000, fetch: app.fetch, idleTimeout:225 };
