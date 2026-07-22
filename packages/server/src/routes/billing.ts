import { Hono } from "hono";
import {
  requireInternalWebAuth,
  type InternalWebAuthEnv,
} from "../middleware/require-internal-web-auth";
import { createCheckoutUrl, createCustomerPortalUrl } from "../lib/polar";

const app = new Hono<InternalWebAuthEnv>()
  .use("*", requireInternalWebAuth)
  .get("/checkout", async (c) => {
    const userId = c.get("userId");
    
    // Detect source from query params (passed from Next.js as ?source=web, or from CLI)
    const source = c.req.query("source") || "web";

    // Build dynamic success URL pointing back to our /success route with the source context
    const urlObj = new URL(c.req.url);
    const successUrl = `${urlObj.protocol}//${urlObj.host}/dashboard-billing/success?source=${source}`;

    return c.json({
      url: await createCheckoutUrl({
        customerExternalId: userId,
        requestUrl: successUrl,
      }),
    });
  })
  .get("/portal", async (c) => {
    const userId = c.get("userId");
    return c.json({
      url: await createCustomerPortalUrl({ 
        customerExternalId: userId, 
        requestUrl: c.req.url 
      })
    });
  })
  .get("/success", (c) => {
    const source = c.req.query("source");

    // If the checkout originated from the CLI, render a clean, modern UI card
    if (source === "cli") {
        return c.html(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>GBAM CLI - Checkout Successful</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        background-color: #090d16;
                        color: #f1f5f9;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                    }
                    .card {
                        background: #111827;
                        border: 1px solid #1f2937;
                        padding: 2.5rem;
                        border-radius: 1rem;
                        text-align: center;
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
                        max-width: 420px;
                        width: 100%;
                    }
                    .badge {
                        display: inline-block;
                        background: rgba(56, 189, 248, 0.1);
                        color: #38bdf8;
                        padding: 0.25rem 0.75rem;
                        border-radius: 9999px;
                        font-size: 0.75rem;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        margin-bottom: 1rem;
                    }
                    .icon {
                        font-size: 2.5rem;
                        margin-bottom: 1rem;
                    }
                    h1 {
                        font-size: 1.4rem;
                        font-weight: 700;
                        color: #38bdf8;
                        margin-bottom: 0.75rem;
                        margin-top: 0;
                    }
                    p {
                        color: #9ca3af;
                        font-size: 0.95rem;
                        line-height: 1.6;
                        margin: 0;
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="badge">GBAM Terminal Client</div>
                    <div class="icon">✨</div>
                    <h1>Checkout Successful!</h1>
                    <p>Your purchase has been proccessed. You can now safely close this browser tab and return to your terminal CLI.</p>
                </div>
            </body>
            </html>
        `);
    }

    // Default behavior for web requests: redirect straight back to the dashboard
    return c.redirect("https://gbam.dev/dashboard");
});

export default app;