import { createHmac, timingSafeEqual } from "node:crypto";
import { getCreditPackById, getTotalCredits, type CreditPackId } from "@gbam/shared";

type CheckoutSource = "cli" | "web";

type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url?: string;
    access_code?: string;
    reference?: string;
  };
};

export type PaystackWebhookEvent = {
  event?: string;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    paid_at?: string | null;
    metadata?: Record<string, unknown> | null;
    customer?: {
      email?: string | null;
    } | null;
  };
};

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
}

function getPaystackSecretKey() {
  return getRequiredEnv("PAYSTACK_SECRET_KEY");
}

function getPaystackApiBaseUrl() {
  return process.env.PAYSTACK_API_BASE_URL ?? "https://api.paystack.co";
}

async function paystackFetch<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${getPaystackApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getPaystackSecretKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "<no body>");
    throw new Error(`Paystack request failed (${response.status}): ${body}`);
  }

  return response.json() as Promise<T>;
}

export async function createCheckoutUrl({
  userId,
  email,
  packId,
  callbackUrl,
  source,
}: {
  userId: string;
  email: string;
  packId: CreditPackId;
  callbackUrl: string;
  source: CheckoutSource;
}) {
  const pack = getCreditPackById(packId);
  if (!pack) {
    throw new Error(`Unknown credit pack: ${packId}`);
  }

  const totalCredits = getTotalCredits(pack);
  const reference = `gbam_${source}_${packId}_${crypto.randomUUID()}`;

  const result = await paystackFetch<PaystackInitializeResponse>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email,
      amount: pack.retailPriceNgn * 100,
      currency: "NGN",
      reference,
      callback_url: callbackUrl,
      metadata: {
        userId,
        packId,
        source,
        totalCredits,
        baseCredits: pack.baseCredits,
        bonusCredits: pack.bonusCredits,
        packLabel: pack.label,
      },
    }),
  });

  const url = result.data?.authorization_url;
  if (!result.status || !url) {
    throw new Error(result.message || "Paystack checkout URL was not returned");
  }

  return {
    url,
    reference: result.data?.reference ?? reference,
  };
}

export function verifyPaystackWebhookSignature(rawBody: string, signatureHeader: string | undefined) {
  if (!signatureHeader) {
    return false;
  }

  const expected = createHmac("sha512", getPaystackSecretKey()).update(rawBody).digest("hex");
  const provided = Buffer.from(signatureHeader);
  const actual = Buffer.from(expected);

  return provided.length === actual.length && timingSafeEqual(provided, actual);
}

export function parsePaystackWebhookEvent(rawBody: string): PaystackWebhookEvent {
  return JSON.parse(rawBody) as PaystackWebhookEvent;
}
