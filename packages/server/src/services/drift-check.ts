import { SUPPORTED_CHAT_MODELS } from "@gbam/shared";

const USD_TO_NGN_RATE = 1400;

export type DriftAlert = {
    model: string;
    type: "input" | "output";
    localNgNPerMillionTokens: number;
    remoteNgNPerMillionTokens: number;
};

export async function checkPriceDrift(): Promise<DriftAlert[]> {
    const res = await fetch("https://openrouter.ai/api/v1/models");
    if (!res.ok) {
        throw new Error(`OpenRouter API returned status ${res.status}`);
    }

    const { data } = await res.json();
    const driftAlerts: DriftAlert[] = [];

    for (const localModel of SUPPORTED_CHAT_MODELS) {
        const remoteModel = data.find((m: { id: string }) => m.id === localModel.id);
        if (!remoteModel || !remoteModel.pricing) continue;

        // OpenRouter pricing is string USD per 1 token (e.g. "0.0000015")
        // Convert to NGN per 1,000,000 tokens:
        const remoteInputNgN = parseFloat(remoteModel.pricing.prompt || "0") * 1_000_000 * USD_TO_NGN_RATE;
        const remoteOutputNgN = parseFloat(remoteModel.pricing.completion || "0") * 1_000_000 * USD_TO_NGN_RATE;

        // Check Input Price Drift
        if (Math.abs(remoteInputNgN - localModel.pricing.inputNgNPerMillionTokens) > 0.1) {
            driftAlerts.push({
                model: localModel.id,
                type: "input",
                localNgNPerMillionTokens: localModel.pricing.inputNgNPerMillionTokens,
                remoteNgNPerMillionTokens: Number(remoteInputNgN.toFixed(2)),
            });
        }

        // Check Output Price Drift
        if (Math.abs(remoteOutputNgN - localModel.pricing.outputNgNPerMillionTokens) > 0.1) {
            driftAlerts.push({
                model: localModel.id,
                type: "output",
                localNgNPerMillionTokens: localModel.pricing.outputNgNPerMillionTokens,
                remoteNgNPerMillionTokens: Number(remoteOutputNgN.toFixed(2)),
            });
        }
    }

    if (driftAlerts.length > 0) {
        console.warn(`[PRICE DRIFT DETECTED] ${driftAlerts.length} discrepancies found:`, driftAlerts);
    } else {
        console.log("[PRICE DRIFT CHECK] All models are in sync with OpenRouter pricing.");
    }

    return driftAlerts;
}