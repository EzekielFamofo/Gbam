import open from "open";
import { apiClient } from "./api-client";
import { getErrorMessage } from "./htttp-errors";

export async function openUpgradeCheckout() {
    // Corrected to $post() with no query arguments needed
    const response = await apiClient.billing.checkout.$post();

    if (response.ok) {
        const data = await response.json();
        await open(data.url);
        return;
    }

    throw new Error(await getErrorMessage(response));
};

export async function openBillingPortal() {
    // Corrected to $post()
    const response = await apiClient.billing.portal.$post();

    if (response.ok) {
        const data = await response.json();
        await open(data.url);
        return;
    }

    throw new Error(await getErrorMessage(response));
};