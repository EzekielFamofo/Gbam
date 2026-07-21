import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

function getInternalSecret() {
  return process.env.GBAM_INTERNAL_WEB_SECRET ??
    (process.env.NODE_ENV !== "production" ? "dev_gbam_dashboard_secret" : undefined);
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.gbam.dev";
  const internalSecret = getInternalSecret();

  if (!internalSecret) {
    return NextResponse.json({ error: "GBAM_INTERNAL_WEB_SECRET is not configured" }, { status: 500 });
  }

  const backendRes = await fetch(`${apiUrl}/dashboard`, {
    method: "GET",
    headers: {
      "x-gbam-internal-secret": internalSecret,
      "x-gbam-user-id": userId,
    },
    cache: "no-store",
  });

  if (!backendRes.ok) {
    return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: backendRes.status });
  }

  const dashboard = await backendRes.json();
  return NextResponse.json(dashboard);
}
