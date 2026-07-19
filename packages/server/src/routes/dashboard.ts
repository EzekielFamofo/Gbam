import { Hono } from "hono";
import { getDashboardData } from "../lib/dashboard";
import {
  requireInternalWebAuth,
  type InternalWebAuthEnv,
} from "../middleware/require-internal-web-auth";

const app = new Hono<InternalWebAuthEnv>()
  .use("*", requireInternalWebAuth)
  .get("/", async (c) => {
    const userId = c.get("userId");
    return c.json(await getDashboardData(userId));
  });

export default app;
