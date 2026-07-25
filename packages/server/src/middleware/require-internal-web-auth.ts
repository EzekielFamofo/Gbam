import { createMiddleware } from "hono/factory";
import { timingSafeEqual } from "node:crypto";

export type InternalWebAuthEnv = {
  Variables: { userId: string };
};

function getExpectedSecret() {
  if (process.env.GBAM_INTERNAL_WEB_SECRET) return process.env.GBAM_INTERNAL_WEB_SECRET;
  if (process.env.NODE_ENV === "development") return "dev_gbam_dashboard_secret";
  return undefined;
}

function secretsMatch(provided: string, expected: string) {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const requireInternalWebAuth = createMiddleware<InternalWebAuthEnv>(async (c, next) => {
  const expectedSecret = getExpectedSecret();
  if (!expectedSecret) {
    console.error("GBAM_INTERNAL_WEB_SECRET is not configured for internal web requests");
    return c.json({ error: "Internal dashboard auth is not configured" }, 500);
  }

  const providedSecret = c.req.header("x-gbam-internal-secret");
  const userId = c.req.header("x-gbam-user-id");

  if (!providedSecret || !userId || !secretsMatch(providedSecret, expectedSecret)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", userId);
  await next();
});