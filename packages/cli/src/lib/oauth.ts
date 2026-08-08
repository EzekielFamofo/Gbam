import open from "open";
import { saveAuth } from "./auth";

const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

type OAuthState = {
    nonce: string;
    port: number;
};

/**
 * Resolves the ArrayBuffer type mismatch with Buffer.from
 */
function toBase64Url(input: Uint8Array | string | ArrayBuffer): string {
    if (typeof input === "string") {
        return Buffer.from(input, "utf-8").toString("base64url");
    }
    // Consolidate both ArrayBuffer and Uint8Array cleanly for Buffer.from
    return Buffer.from(new Uint8Array(input)).toString("base64url");
}

async function createPkceChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(verifier));
    return toBase64Url(digest);
}

function encodeState(state: OAuthState): string {
    return toBase64Url(JSON.stringify(state));
}

function decodeState(state: string): OAuthState {
    try {
        const decodedJson = Buffer.from(state, "base64url").toString("utf-8");
        return JSON.parse(decodedJson) as OAuthState;
    } catch {
        throw new Error("Invalid state encoding");
    }
}

/**
 * Synchronous error parsing to replace the async HTTP `getErrorMessage` 
 * inside synchronous catch blocks.
 */
function extractErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    return String(err);
}

export async function performLogin(): Promise<{ token: string }> {
    const clerkFrontendApi = "https://clerk.gbam.dev";
    const clientId = "591uvOvTs2nG59HL";

    const apiUrl = process.env.API_URL ?? "https://api.gbam.dev";
    const webUrl = process.env.WEB_URL ?? "https://gbam.dev";

    if (!clerkFrontendApi) throw new Error("CLERK_FRONTEND_API not set");
    if (!clientId) throw new Error("CLERK_OAUTH_CLIENT_ID not set");

    const nonce = crypto.randomUUID();
    const rawVerifier = crypto.getRandomValues(new Uint8Array(32));
    const codeVerifier = toBase64Url(rawVerifier);
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

                const cleanupAndStop = (ms = 1000) => {
                    setTimeout(() => {
                        try {
                            server.stop();
                        } catch {
                            // Server might already be stopped
                        }
                    }, ms);
                };

                const error = url.searchParams.get("error");
                if (error) {
                    const msg = url.searchParams.get("error_description") ?? error;
                    settled = true;
                    reject(new Error(msg));
                    cleanupAndStop();
                    return Response.redirect(`${webUrl}/cli-success?error=${encodeURIComponent(msg)}`, 302);
                }

                const code = url.searchParams.get("code");
                const state = url.searchParams.get("state");

                if (!code || !state) {
                    settled = true;
                    reject(new Error("Missing authorization code or state"));
                    cleanupAndStop();
                    return Response.redirect(`${webUrl}/cli-success?error=missing_params`, 302);
                }

                // Verify nonce from state payload
                try {
                    const payload = decodeState(state);
                    if (payload.nonce !== nonce) {
                        throw new Error("State mismatch (Possible CSRF)");
                    }
                } catch (err) {
                    settled = true;
                    const errorMsg = extractErrorMessage(err);
                    reject(new Error(errorMsg));
                    cleanupAndStop();
                    return Response.redirect(`${webUrl}/cli-success?error=${encodeURIComponent(errorMsg)}`, 302);
                }

                try {
                    const redirectUri = `${apiUrl}/auth/callback`;

                    // Exchange authorization code for Clerk token
                    const tokenRes = await fetch(`${clerkFrontendApi}/oauth/token`, {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: new URLSearchParams({
                            grant_type: "authorization_code",
                            code,
                            redirect_uri: redirectUri,
                            client_id: clientId,
                            code_verifier: codeVerifier,
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

                    cleanupAndStop();
                    return Response.redirect(`${webUrl}/cli-success`, 302);
                } catch (err) {
                    settled = true;
                    const errorMsg = extractErrorMessage(err);
                    reject(new Error(errorMsg));
                    cleanupAndStop();
                    return Response.redirect(`${webUrl}/cli-success?error=${encodeURIComponent(errorMsg)}`, 302);
                }
            },
        });

        const port = server.port;
        if (typeof port !== "number" || port === 0) {
            server.stop();
            reject(new Error("Failed to start local callback server"));
            return;
        }

        const state = encodeState({ port, nonce });

        const authorizeUrl = new URL(`${webUrl}/cli-auth`);
        authorizeUrl.searchParams.set("state", state);
        authorizeUrl.searchParams.set("code_challenge", codeChallenge);
        authorizeUrl.searchParams.set("code_challenge_method", "S256");

        console.log("\nOpening browser to authenticate...");
        console.log(`If the browser does not open automatically, visit:\n${authorizeUrl.toString()}\n`);

        open(authorizeUrl.toString()).catch(() => {
            console.log("Could not open browser automatically.");
        });

        setTimeout(() => {
            if (!settled) {
                settled = true;
                try {
                    server.stop();
                } catch {
                    // Ignore stop errors on timeout
                }
                reject(new Error("Login process timed out after 5 minutes"));
            }
        }, LOGIN_TIMEOUT_MS);
    });
}