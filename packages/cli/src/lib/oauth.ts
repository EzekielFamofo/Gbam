import open from "open";
import { saveAuth } from "./auth";
import { getErrorMessage } from "./htttp-errors";

const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

type OAuthState = {
    nonce: string;
    port: number;
}

function toBaseUrl(input: Uint8Array | string) {
    return Buffer.from(input).toString("base64url");
}

async function createPkceChallenge(verifier: string) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    return toBaseUrl(new Uint8Array(digest));
}

function encodeState(state: OAuthState) {
    return toBaseUrl(JSON.stringify(state));
}

function decodeState(state: string) {
    const [encoded] = state.split(".");
    if (!encoded) {
        throw new Error("Invalid state");
    }

    return JSON.parse(Buffer.from(encoded, "base64url").toString()) as OAuthState;
}

export async function performLogin() {
    const clerkFrontendApi = "https://supreme-cougar-41.clerk.accounts.dev";
    const clientId = "591uvOvTs2nG59HL";

    const apiUrl = process.env.API_URL ?? "https://api.gbam.dev";
    const webUrl = process.env.WEB_URL ?? "https://gbam.dev";

    if (!clerkFrontendApi) throw new Error("CLERK_FRONTEND_API not set");
    if (!clientId) throw new Error("CLERK_OAUTH_CLIENT_ID not set");

    const nonce = crypto.randomUUID();
    const codeVerifier = toBaseUrl(crypto.getRandomValues(new Uint8Array(32)));
    const codeChallenge = await createPkceChallenge(codeVerifier);

    let settled = false;

    return new Promise<{ token: string }>((resolve, reject) => {
        const server = Bun.serve({
            port: 0,
            async fetch(req) {
                const url = new URL(req.url);

                if (url.pathname !== "/callback") {
                    return new Response("Not found", { status: 404 });
                }
                
                const error = url.searchParams.get("error");

                if (error) {
                    const msg = url.searchParams.get("error_description") ?? error;
                    settled = true;
                    reject(new Error(msg));
                    setTimeout(() => server.stop(), 500);
                    return new Response(`Authentication failed: ${msg}`, { status: 400 });
                }

                const code = url.searchParams.get("code");
                const state = url.searchParams.get("state");

                if (!code || !state) {
                    settled = true;
                    reject(new Error("Missing code or state"));
                    setTimeout(() => server.stop(), 500);
                    return new Response("Bad request", { status: 400 });
                }

                // Verify nonce from state
                try {
                    const payload = decodeState(state);
                    
                    if (payload.nonce !== nonce) throw new Error("State mismatch");
                } catch (err) {
                    settled = true;
                    reject(err);
                    setTimeout(() => server.stop(), 500);
                    return new Response("Invalid State", { status: 400 });
                }

                try {
                    // This MUST exactly match the CLI_OAUTH_REDIRECT_URI set in your web/cli-auth/page.tsx
                    const redirectUri = `${apiUrl}/auth/callback`;

                    // Exchange authorization code for Clerk tokens
                    const tokenRes = await fetch(`${clerkFrontendApi}/oauth/token`, {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: new URLSearchParams({
                            grant_type: "authorization_code",
                            code,
                            redirect_uri: redirectUri, 
                            client_id: clientId,
                            code_verifier: codeVerifier
                        }),
                    });
                    
                    if (!tokenRes.ok) {
                        const details = await tokenRes.text();
                        throw new Error(details || "Failed to exchange authorization code");
                    }

                    const tokenData = (await tokenRes.json()) as { access_token: string };

                    settled = true;
                    saveAuth({ token: tokenData.access_token });
                    resolve({ token: tokenData.access_token });
                    setTimeout(() => server.stop(), 500);
                    return new Response("Authenticated! You can close this tab.");

                } catch (err) {
                    settled = true;
                    reject(err);
                    const message = await getErrorMessage(err as any);
                    setTimeout(() => server.stop(), 500);
                    return new Response(`Authentication failed: ${message}`, { status: 400 });
                }
           },
        });

        // Build state with port and nonce
        const port = server.port;
        if (typeof port !== "number") {
            server.stop();
            reject(new Error("Failed to start callback server"));
            return;
        }

        const state = encodeState({ port, nonce });

        // Point the CLI to your custom Web Next.js application instead of Clerk directly
        const authorizeUrl = new URL(`${webUrl}/cli-auth`);
        authorizeUrl.searchParams.set("state", state);
        authorizeUrl.searchParams.set("code_challenge", codeChallenge);
        authorizeUrl.searchParams.set("code_challenge_method", "S256");

        console.log("Opening browser to authenticate...");
        
        void open(authorizeUrl.toString());

        setTimeout(() => {
            if (!settled) {
                settled = true;
                server.stop();
                reject(new Error("Login timed out"));
            }
        }, LOGIN_TIMEOUT_MS);
    });
}