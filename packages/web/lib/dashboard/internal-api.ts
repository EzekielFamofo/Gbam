import "server-only";

function getInternalSecret(): string {
  const secret = process.env.GBAM_INTERNAL_WEB_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "development") {
    return "dev_gbam_dashboard_secret";
  }

  throw new Error("GBAM_INTERNAL_WEB_SECRET is not configured");
}

const INTERNAL_API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.gbam.dev";

export async function fetchInternalApi(
  path: string,
  userId: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${INTERNAL_API_URL}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      "x-gbam-internal-secret": getInternalSecret(),
      "x-gbam-user-id": userId,
    },
    cache: "no-store",
  });
}