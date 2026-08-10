import open from "open";
import { clearAuth, getAuth, saveAuth, type AuthData } from "./auth";

const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

// Refresh proactively if the access token is within this window of expiry,
// rather than waiting for the server to actually reject it.
const TOKEN_REFRESH_BUFFER_MS = 60_000;

type OAuthState = {
    nonce: string;
    port: number;
};

type TokenResponse = {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
};

/**
 * Resolves the ArrayBuffer type mismatch with Buffer.from
 */
function toBase64Url(input: Uint8Array | string | ArrayBuffer): string {
    if (typeof input === "string") {
        return Buffer.from(input, "utf-8").toString("base64url");
    }
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

function extractErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    return String(err);
}

function computeExpiresAt(expiresIn: number | undefined): number | undefined {
    if (typeof expiresIn !== "number" || !Number.isFinite(expiresIn)) return undefined;
    return Date.now() + expiresIn * 1000;
}

const CLERK_FRONTEND_API = "https://clerk.gbam.dev";
const CLERK_OAUTH_CLIENT_ID = "GHubOiwI6tR1pqpA";

let inFlightRefresh: Promise<AuthData | null> | null = null;

/**
 * Exchanges the stored refresh token for a new access token, saving the
 * result. Deduped against concurrent callers: refresh tokens are commonly
 * rotated on use, so two simultaneous refresh attempts could otherwise
 * race - the second one reusing an already-invalidated token and failing
 * even though the first one succeeded.
 */
export async function refreshAuthToken(): Promise<AuthData | null> {
    if (inFlightRefresh) return inFlightRefresh;

    inFlightRefresh = performRefresh().finally(() => {
        inFlightRefresh = null;
    });

    return inFlightRefresh;
}

async function performRefresh(): Promise<AuthData | null> {
    const current = getAuth();
    if (!current?.refreshToken) return null;

    try {
        const tokenRes = await fetch(`${CLERK_FRONTEND_API}/oauth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: current.refreshToken,
                client_id: CLERK_OAUTH_CLIENT_ID,
            }),
        });

        if (!tokenRes.ok) {
            // Refresh token itself is invalid, expired, or revoked - nothing
            // recoverable locally. Clear auth so the next request prompts a
            // clean /login instead of silently retrying a dead token forever.
            clearAuth();
            return null;
        }

        const tokenData = (await tokenRes.json()) as TokenResponse;

        const nextAuth: AuthData = {
            token: tokenData.access_token,
            // Prefer a rotated refresh token if one came back; fall back to
            // reusing the current one only if the response didn't include a
            // new one at all.
            refreshToken: tokenData.refresh_token ?? current.refreshToken,
            expiresAt: computeExpiresAt(tokenData.expires_in),
        };

        saveAuth(nextAuth);
        return nextAuth;
    } catch {
        // Network failure etc. - don't clear auth on a transient error,
        // just fail this attempt and let the caller fall back to the
        // existing (possibly still-valid) token.
        return null;
    }
}

/**
 * What request-sending code should call instead of the raw getAuth(). Checks
 * expiry and refreshes proactively first if the access token is expiring
 * soon, so a long-lived CLI install stays signed in across days/weeks
 * without the user re-running /login, as long as the refresh token (which
 * per Clerk never expires on its own) hasn't been revoked.
 */
export async function getValidAuth(): Promise<AuthData | null> {
    const current = getAuth();
    if (!current) return null;

    const isExpiringSoon =
        typeof current.expiresAt === "number" &&
        current.expiresAt - Date.now() < TOKEN_REFRESH_BUFFER_MS;

    // No expiresAt means this token predates refresh support (saved by an
    // older CLI version) - nothing to proactively refresh with. Use it as-is
    // until the server's own 401 handling clears it.
    if (!isExpiringSoon || !current.refreshToken) {
        return current;
    }

    const refreshed = await refreshAuthToken();
    // If refresh failed, fall back to the old token rather than blocking the
    // request outright - if it's genuinely dead, the server's existing 401
    // handling takes over from there.
    return refreshed ?? current;
}

export async function performLogin(): Promise<{ token: string }> {
    const apiUrl = process.env.API_URL ?? "https://api.gbam.dev";
    const webUrl = process.env.WEB_URL ?? "https://gbam.dev";

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

                    const tokenRes = await fetch(`${CLERK_FRONTEND_API}/oauth/token`, {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: new URLSearchParams({
                            grant_type: "authorization_code",
                            code,
                            redirect_uri: redirectUri,
                            client_id: CLERK_OAUTH_CLIENT_ID,
                            code_verifier: codeVerifier,
                        }),
                    });

                    if (!tokenRes.ok) {
                        const details = await tokenRes.text();
                        throw new Error(details || "Failed to exchange authorization code");
                    }

                    const tokenData = (await tokenRes.json()) as TokenResponse;

                    settled = true;
                    saveAuth({
                        token: tokenData.access_token,
                        refreshToken: tokenData.refresh_token,
                        expiresAt: computeExpiresAt(tokenData.expires_in),
                    });
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