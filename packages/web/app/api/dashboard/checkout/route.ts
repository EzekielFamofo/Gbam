import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

function getInternalSecret() {
  return process.env.GBAM_INTERNAL_WEB_SECRET ??
    (process.env.NODE_ENV !== "production" ? "dev_gbam_dashboard_secret" : undefined);
}

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.gbam.dev";
  const internalSecret = getInternalSecret();

  if (!internalSecret) {
    return new NextResponse("GBAM internal dashboard secret is not configured", { status: 500 });
  }

  const response = await fetch(`${apiUrl}/dashboard-billing/checkout`, {
    method: "GET",
    headers: {
      "x-gbam-internal-secret": internalSecret,
      "x-gbam-user-id": userId,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return new NextResponse("Unable to start checkout right now", { status: 502 });
  }

  const data = (await response.json()) as { url?: string };
  if (!data.url) {
    return new NextResponse("Checkout URL was not returned", { status: 502 });
  }

  return NextResponse.redirect(data.url);
}
