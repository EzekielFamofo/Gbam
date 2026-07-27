import type { AuthenticatedEnv } from "../middleware/require-auth";
import { createCheckoutUrl, createCustomerPortalUrl } from "../lib/polar";
import { creditPackIdSchema, type CreditPackId } from "@gbam/shared";
import { Hono } from "hono";

const app = new Hono<AuthenticatedEnv>()
    // 1. PUBLIC route for the CLI success screen (Must be FIRST)
    .get("/success", (c) => {
        return c.html(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>GBAM CLI - Checkout Successful</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #090d16; color: #f1f5f9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                    .card { background: #111827; border: 1px solid #1f2937; padding: 2.5rem; border-radius: 1rem; text-align: center; max-width: 420px; width: 100%; }
                    .badge { display: inline-block; background: rgba(56, 189, 248, 0.1); color: #38bdf8; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; margin-bottom: 1rem; }
                    h1 { font-size: 1.4rem; color: #38bdf8; margin-top: 0.5rem; }
                    p { color: #9ca3af; font-size: 0.95rem; line-height: 1.6; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="badge">GBAM Terminal Client</div>
                    <div style="font-size: 2.5rem;">✨</div>
                    <h1>Checkout Successful!</h1>
                    <p>Your purchase has been processed. You can now safely close this browser tab and return to your terminal CLI.</p>
                </div>
            </body>
            </html>
        `);
    })
    // 2. PROTECTED routes for the CLI API
    .post("/checkout", async (c) => {
        const userId = c.get("userId");
        
        // Extract packId from request body or query param (defaults to 'builder')
        const body = await c.req.json().catch(() => ({}));
        const packIdResult = creditPackIdSchema.safeParse(body.packId);

        if (!packIdResult.success) {
            return c.json({ error: "Invalid or missing packId. Must be 'starter', 'builder', or 'pro'." }, 400);
        }

        const packId: CreditPackId = packIdResult.data;
        
        const apiUrl = process.env.API_URL || "https://api.gbam.dev";
        const successUrl = `${apiUrl}/billing/success`;

        return c.json({
            url: await createCheckoutUrl({ 
                customerExternalId: userId, 
                requestUrl: successUrl,
                packId,
            }),
        });
    })
    .post("/portal", async (c) => {
        const userId = c.get("userId");
        return c.json({
            url: await createCustomerPortalUrl({ customerExternalId: userId, requestUrl: c.req.url })
        });
    });

export default app;