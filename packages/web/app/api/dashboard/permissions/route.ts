import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { fetchInternalApi } from "@/lib/dashboard/internal-api";

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const body = await request.json();

  let response: Response;
  try {
    response = await fetchInternalApi("/dashboard-permissions", userId, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error("[api/dashboard/permissions] internal auth misconfigured:", error);
    return new NextResponse("GBAM internal dashboard secret is not configured", { status: 500 });
  }

  if (!response.ok) return new NextResponse("Unable to save permissions right now", { status: response.status });

  return NextResponse.json(await response.json());
}