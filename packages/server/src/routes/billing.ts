import { Hono } from "hono";
import { creditPackIdSchema, getCreditPackById, type CreditPackId } from "@gbam/shared";
import type { AuthenticatedEnv } from "../middleware/require-auth";
import { getUserPrimaryEmailAddress } from "../lib/auth";
import {
  createCheckoutUrl,
  parsePaystackWebhookEvent,
  verifyPaystackWebhookSignature,
} from "../lib/paystack";
import { recordPurchaseCreditTransaction } from "../lib/credits-ledger";

function buildSuccessUrl(baseUrl: string, packId: CreditPackId, source: "cli" | "web") {
  const url = new URL("/billing/success", baseUrl);
  url.searchParams.set("pack", packId);
  url.searchParams.set("source", source);
  return url.toString();
}

function getStringMetadataValue(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : undefined;
}

const app = new Hono<AuthenticatedEnv>()
  .get("/success", (c) => {
    return c.html(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GBAM CLI - Payment Received</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #090d16; color: #f1f5f9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .card { background: #111827; border: 1px solid #1f2937; padding: 2.5rem; border-radius: 1rem; text-align: center; max-width: 460px; width: 100%; }
          .badge { display: inline-block; background: rgba(56, 189, 248, 0.1); color: #38bdf8; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; margin-bottom: 1rem; }
          h1 { font-size: 1.4rem; color: #38bdf8; margin-top: 0.5rem; }
          p { color: #9ca3af; font-size: 0.95rem; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">GBAM Terminal Client</div>
          <div style="font-size: 2.5rem;">✨</div>
          <h1>Payment received</h1>
          <p>Your checkout has completed. Your credits should appear in GBAM shortly after payment verification. You can now close this tab and return to your terminal.</p>
        </div>
      </body>
      </html>
    `);
  })
  .post("/webhooks/paystack", async (c) => {
    const rawBody = await c.req.text();
    const signature = c.req.header("x-paystack-signature");

    if (!verifyPaystackWebhookSignature(rawBody, signature)) {
      return c.json({ error: "Invalid webhook signature" }, 401);
    }

    const event = parsePaystackWebhookEvent(rawBody);
    if (event.event !== "charge.success" || event.data?.status !== "success") {
      return c.json({ received: true });
    }

    const metadata = event.data.metadata ?? null;
    const userId = getStringMetadataValue(metadata, "userId");
    const parsedPack = creditPackIdSchema.safeParse(getStringMetadataValue(metadata, "packId"));
    const reference = event.data.reference;

    if (!userId || !parsedPack.success || !reference) {
      console.error("[billing/paystack-webhook] Missing required metadata", { event });
      return c.json({ error: "Missing webhook metadata" }, 400);
    }

    const pack = getCreditPackById(parsedPack.data);
    if (!pack) {
      return c.json({ error: "Unknown credit pack" }, 400);
    }

    const amountPaidNgn = typeof event.data.amount === "number" ? Math.round(event.data.amount / 100) : null;
    if (amountPaidNgn != null && amountPaidNgn !== pack.retailPriceNgn) {
      console.error("[billing/paystack-webhook] Amount mismatch", {
        reference,
        expected: pack.retailPriceNgn,
        received: amountPaidNgn,
        packId: parsedPack.data,
        userId,
      });
      return c.json({ error: "Amount mismatch" }, 400);
    }

    await recordPurchaseCreditTransaction({
      userId,
      packId: parsedPack.data,
      providerReference: reference,
      amountPaidNgn,
      metadata: {
        source: getStringMetadataValue(metadata, "source") ?? null,
        currency: event.data.currency ?? null,
        paidAt: event.data.paid_at ?? null,
        customerEmail: event.data.customer?.email ?? null,
        paystackEvent: event.event ?? null,
      },
    });

    return c.json({ received: true });
  })
  .post("/checkout", async (c) => {
    const userId = c.get("userId");
    const body = await c.req.json().catch(() => ({}));
    const rawPackId = body.packId ?? "builder";
    const parsedPack = creditPackIdSchema.safeParse(rawPackId);

    if (!parsedPack.success) {
      return c.json({ error: "Invalid packId. Must be 'starter', 'builder', or 'pro'." }, 400);
    }

    try {
      const email = await getUserPrimaryEmailAddress(userId);
      const apiUrl = process.env.API_URL || "https://api.gbam.dev";
      const callbackUrl = buildSuccessUrl(apiUrl, parsedPack.data, "cli");
      const { url } = await createCheckoutUrl({
        userId,
        email,
        packId: parsedPack.data,
        callbackUrl,
        source: "cli",
      });

      return c.json({ url });
    } catch (error) {
      console.error("[billing/checkout] Failed to initialize checkout", {
        error,
        userId,
        packId: parsedPack.data,
      });
      return c.json({ error: "Unable to start checkout right now" }, 502);
    }
  })
  .post("/portal", async (c) => {
    const webUrl = process.env.WEB_URL || "https://gbam.dev";
    return c.json({
      url: new URL("/dashboard/usage", webUrl).toString(),
    });
  });

export default app;
