import { hc } from "hono/client";
import type { AppType } from "@gbam/server";
import { clearAuth } from "./auth";
import { getValidAuth, refreshAuthToken } from "./oauth";

async function performFetch(
    input: Parameters<typeof fetch>[0],
    init: Parameters<typeof fetch>[1] | undefined,
    token: string | undefined,
): Promise<Response> {
    const headers = new Headers(init?.headers);
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(input, { ...init, headers });
}

async function fetchWithAuth(
    input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1],
): Promise<Response> {
    const auth = await getValidAuth();
    const response = await performFetch(input, init, auth?.token);

    if (response.status !== 401) {
        return response;
    }

    if (!auth?.refreshToken) {
        // No refresh token to fall back on - same as the original,
        // pre-refresh behavior: a 401 here is unrecoverable locally.
        clearAuth();
        return response;
    }

    // Try exactly one reactive refresh + retry before giving up.
    const refreshed = await refreshAuthToken();
    if (!refreshed) {
        // refreshAuthToken() already decides for itself whether this
        // failure means "genuinely dead, clear auth" (server rejected the
        // refresh token) vs "transient network issue, leave the stored
        // refresh token alone for next time" - don't second-guess that
        // here by clearing auth again ourselves.
        return response;
    }

    return performFetch(input, init, refreshed.token);
}

export const apiClient = hc<AppType>(
    process.env.API_URL ?? "https://api.gbam.dev",
    {
        fetch: fetchWithAuth,
    },
);