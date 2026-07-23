import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

function getInternalSecret() {
  return process.env.GBAM_INTERNAL_WEB_SECRET ??
    (process.env.NODE_ENV !== "production" ? "dev_gbam_dashboard_secret" : undefined);
}

export async function PATCH(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const internalSecret = getInternalSecret();
  if (!internalSecret) {
    return new NextResponse("GBAM internal dashboard secret is not configured", { status: 500 });
  }

  const body = await request.json();
  const { dailySpendLimit, monthlySpendLimit } = body;

  const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.gbam.dev";

  const response = await fetch(`${apiUrl}/dashboard-limits`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-gbam-internal-secret": internalSecret,
      "x-gbam-user-id": userId,
    },
    body: JSON.stringify({ dailySpendLimit, monthlySpendLimit }),
    cache: "no-store",
  });

  if (!response.ok) {
    return new NextResponse("Unable to save spend limits right now", { status: response.status });
  }

  return NextResponse.json({ success: true });
}