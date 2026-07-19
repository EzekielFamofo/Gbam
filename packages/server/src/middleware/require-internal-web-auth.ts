import { createMiddleware } from "hono/factory";

export type InternalWebAuthEnv = {
  Variables: {
    userId: string;
  };
};

function getExpectedSecret() {
  return process.env.GBAM_INTERNAL_WEB_SECRET ??
    (process.env.NODE_ENV !== "production" ? "dev_gbam_dashboard_secret" : undefined);
}

export const requireInternalWebAuth = createMiddleware<InternalWebAuthEnv>(async (c, next) => {
  const expectedSecret = getExpectedSecret();
  if (!expectedSecret) {
    console.error("GBAM_INTERNAL_WEB_SECRET is not configured for internal web requests");
    return c.json({ error: "Internal dashboard auth is not configured" }, 500);
  }

  const providedSecret = c.req.header("x-gbam-internal-secret");
  const userId = c.req.header("x-gbam-user-id");

  if (!providedSecret || providedSecret !== expectedSecret || !userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", userId);
  await next();
});
