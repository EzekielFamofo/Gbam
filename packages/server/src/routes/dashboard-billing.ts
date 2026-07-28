import { Hono } from "hono";
import { creditPackIdSchema } from "@gbam/shared";
import {
  requireInternalWebAuth,
  type InternalWebAuthEnv,
} from "../middleware/require-internal-web-auth";
import { getUserPrimaryEmailAddress } from "../lib/auth";
import { createCheckoutUrl } from "../lib/paystack";

function buildSuccessUrl(baseUrl: string, packId: string) {
  const url = new URL("/billing/success", baseUrl);
  url.searchParams.set("pack", packId);
  url.searchParams.set("source", "web");
  return url.toString();
}

const app = new Hono<InternalWebAuthEnv>()
  .use("*", requireInternalWebAuth)
  .get("/checkout", async (c) => {
    const userId = c.get("userId");
    const parsedPack = creditPackIdSchema.safeParse(c.req.query("pack"));

    if (!parsedPack.success) {
      return c.json({ error: "Missing or invalid pack" }, 400);
    }

    try {
      const email = await getUserPrimaryEmailAddress(userId);
      const frontendUrl = process.env.WEB_URL || "https://gbam.dev";
      const callbackUrl = buildSuccessUrl(frontendUrl, parsedPack.data);
      const { url } = await createCheckoutUrl({
        userId,
        email,
        packId: parsedPack.data,
        callbackUrl,
        source: "web",
      });

      return c.json({ url });
    } catch (error) {
      console.error("[dashboard-billing/checkout] Failed to initialize checkout", {
        error,
        userId,
        packId: parsedPack.data,
      });
      return c.json({ error: "Failed to create checkout session" }, 502);
    }
  });

export default app;
