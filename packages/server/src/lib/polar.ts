import { Polar } from "@polar-sh/sdk"
import { creditPackIdSchema, type CreditPackId } from "@gbam/shared";

type PolarServer = "sandbox" | "production";

function getRequiredEnv(name: string) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} environment variable is required`);
    }
    return value;
}

export function getPolarAccessToken() {
    return getRequiredEnv("POLAR_ACCESS_TOKEN");
}

const PACK_PRODUCT_ENV_VARS: Record<CreditPackId, string> = {
    starter: "POLAR_PRODUCT_ID_STARTER",
    builder: "POLAR_PRODUCT_ID_BUILDER",
    pro: "POLAR_PRODUCT_ID_PRO",
};

export function getPolarProductId(packId: CreditPackId) {
    const parsed = creditPackIdSchema.safeParse(packId);
    if (!parsed.success) {
        throw new Error(`Unknown credit pack: ${packId}`);
    }
    return getRequiredEnv(PACK_PRODUCT_ENV_VARS[parsed.data]);
}

export function getPolarCreditsMeterId() {
    return getRequiredEnv("POLAR_CREDITS_METER_ID");
}

export function getPolarServer(): PolarServer {
    const server = process.env.POLAR_SERVER;
    if (!server) {
        return "sandbox";
    }

    if (server !== "sandbox" && server !== "production") {
        throw new Error("POLAR_SERVER must be either 'sandbox' or 'production'")
    }

    return server;
}

const polar = new Polar({
    accessToken: getPolarAccessToken(),
    server: getPolarServer(),
});

function hasStatusCode(error: unknown): error is { statusCode: number } {
    return (
        typeof error === "object" &&
        error !== null &&
        "statusCode" in error &&
        typeof (error as Record<string, unknown>).statusCode === "number"
    );
}

type CreateCheckoutUrlParams = {
    customerExternalId: string;
    requestUrl: string;
    packId: CreditPackId;
}

export async function createCheckoutUrl({ customerExternalId, requestUrl, packId }: CreateCheckoutUrlParams) {
    const result = await polar.checkouts.create({
        products: [getPolarProductId(packId)],
        successUrl: new URL("/billing/success", requestUrl).toString(),
        externalCustomerId: customerExternalId,
        metadata: { source: "gbam-cli", packId },
    });

    return result.url;
}

type CreateCustomerPortalUrlParams = {
    customerExternalId: string;
    requestUrl: string;
}

export async function createCustomerPortalUrl({ customerExternalId, requestUrl }: CreateCustomerPortalUrlParams) {
    try {
        const result = await polar.customerSessions.create({
            externalCustomerId: customerExternalId,
            returnUrl: new URL("/billing/success", requestUrl).toString(),
        });

        return result.customerPortalUrl;
    } catch (error) {
        if (hasStatusCode(error) && (error.statusCode === 404 || error.statusCode === 422)) {
            throw new Error("No billing account found. Run /upgrade to get started.");
        }
        throw error;
    }
};
export async function getAvailableCreditsBalance(customerExternalId: string) {
    try {
        const customerState = await polar.customers.getStateExternal({
            externalId: customerExternalId,
        });


        const matchingMeters = customerState.activeMeters.filter(
            (meter) => meter.meterId === getPolarCreditsMeterId(),
        );
        if (matchingMeters.length > 1) {
            throw new Error("Expected exactly one matching Polar credits meter");
        }

        const creditsMeter = matchingMeters[0];
        return creditsMeter?.balance ?? 0;
    } catch (error) {
        if (hasStatusCode(error) && error.statusCode === 404) {
            return 0
        }

        throw error;
    }
};

type IngestAiUsageParams = {
    externalCustomerId: string;
    eventId: string;
    credits: number;
};

export async function IngestAiUsage({ externalCustomerId, eventId, credits }: IngestAiUsageParams) {
    if (credits <= 0) {
        return;
    }

    await polar.events.ingest({
        events: [
            {
                name: "nightcode_usage",
                externalId: eventId,
                externalCustomerId,
                metadata: { credits },
            },
        ],
    });
}