import { Hono } from "hono";
import {
  requireInternalWebAuth,
  type InternalWebAuthEnv,
} from "../middleware/require-internal-web-auth";
import { createCheckoutUrl } from "../lib/polar";

const app = new Hono<InternalWebAuthEnv>()
  .use("*", requireInternalWebAuth)
  .get("/checkout", async (c) => {
    const userId = c.get("userId");
    return c.json({
      url: await createCheckoutUrl({
        customerExternalId: userId,
        requestUrl: c.req.url,
      }),
    });
  });

export default app;
