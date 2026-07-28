import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.gbam.dev";
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  const contentType = request.headers.get("content-type") ?? "application/json";

  try {
    const response = await fetch(`${apiUrl}/billing/webhooks/paystack`, {
      method: "POST",
      headers: {
        "content-type": contentType,
        ...(signature ? { "x-paystack-signature": signature } : {}),
      },
      body: rawBody,
      cache: "no-store",
    });

    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error("[api/webhooks/paystack] Failed to forward webhook", error);
    return NextResponse.json({ error: "Unable to process webhook" }, { status: 502 });
  }
}
