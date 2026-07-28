import { createClerkClient } from "@clerk/backend";

if (!process.env.CLERK_SECRET_KEY) {
    throw new Error("CLERK_SECRET_KEY environment variable is required")
}

if (!process.env.CLERK_PUBLISHABLE_KEY) {
    throw new Error("CLERK_PUBLISHABLE_KEY environment variable is required")
}

const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
});

export async function authenticateOAuthRequest(request: Request) {
    const requestState = await clerkClient.authenticateRequest(request, {
        acceptsToken: "oauth_token"
    });

    if (!requestState.isAuthenticated) {
        return null;
    }

    const auth = requestState.toAuth();
    if (auth.tokenType !== "oauth_token" || !auth.userId)  {
        return null;
    }

    return { userId: auth.userId };
}

export async function getUserPrimaryEmailAddress(userId: string) {
    const user = await clerkClient.users.getUser(userId);
    const primaryEmail = user.emailAddresses.find(
        (email) => email.id === user.primaryEmailAddressId,
    ) ?? user.emailAddresses[0];

    if (!primaryEmail?.emailAddress) {
        throw new Error(`No email address found for user ${userId}`);
    }

    return primaryEmail.emailAddress;
}