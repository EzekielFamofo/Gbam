import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://api.gbam.dev";
  const internalSecret = process.env.GBAM_INTERNAL_WEB_SECRET || "dev_gbam_dashboard_secret";

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
