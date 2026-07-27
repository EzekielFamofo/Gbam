import { Hono } from "hono";
import {
  requireInternalWebAuth,
  type InternalWebAuthEnv,
} from "../middleware/require-internal-web-auth";
import { createCheckoutUrl } from "../lib/polar";
import { creditPackIdSchema } from "@gbam/shared";

const app = new Hono<InternalWebAuthEnv>()
  .use("*", requireInternalWebAuth)
  .get("/checkout", async (c) => {
    const userId = c.get("userId");

    const parsedPack = creditPackIdSchema.safeParse(c.req.query("pack"));
    if (!parsedPack.success) {
      return c.json({ error: "Missing or invalid pack" }, 400);
    }

    const frontendUrl = process.env.WEB_URL || "https://gbam.dev";
    const successUrl = `${frontendUrl}/billing/success`;

    try {
      const url = await createCheckoutUrl({
        customerExternalId: userId,
        requestUrl: successUrl,
        packId: parsedPack.data,
      });
      return c.json({ url });
    } catch (error) {
      console.error("[dashboard-billing/checkout] createCheckoutUrl failed:", {
        error,
        userId,
        packId: parsedPack.data,
      });
      return c.json({ error: "Failed to create checkout session" }, 502);
    }
  });

export default app;