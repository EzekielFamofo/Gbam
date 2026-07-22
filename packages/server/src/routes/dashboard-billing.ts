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
    
    // Hardcode the redirect directly to the frontend dashboard.
    // Ensure this matches your production Next.js URL.
    const successUrl = "https://gbam.dev/dashboard";

    return c.json({
      url: await createCheckoutUrl({
        customerExternalId: userId,
        requestUrl: successUrl, // Polar will send the browser directly here
      }),
    });
  });

export default app;