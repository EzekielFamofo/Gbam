import { SUPPORTED_CHAT_MODELS } from "@gbam/shared";
import { getUsdToNgnRate } from "../lib/fx.js";

export type DriftAlert = {
    model: string;
    type: "input" | "output";
    localNgNPerMillionTokens: number;
    remoteNgNPerMillionTokens: number;
};

export async function checkPriceDrift(): Promise<DriftAlert[]> {
    try {
        const res = await fetch("https://openrouter.ai/api/v1/models");
        if (!res.ok) {
            throw new Error(`OpenRouter API error: ${res.status} ${res.statusText}`);
        }

        const { data } = await res.json();
        const driftAlerts: DriftAlert[] = [];
        const usdToNgnRate = await getUsdToNgnRate();

        for (const localModel of SUPPORTED_CHAT_MODELS) {
            const remoteModel = data.find((m: { id: string }) => m.id === localModel.id);

            if (!remoteModel) {
                console.warn(`[PRICE DRIFT WARNING] Local model "${localModel.id}" not found on OpenRouter.`);
                continue;
            }

            if (!remoteModel.pricing) continue;

            // OpenRouter pricing in USD per 1 token -> convert to NGN per 1M tokens
            const remoteInputUsdPerMillion = parseFloat(remoteModel.pricing.prompt || "0") * 1_000_000;
            const remoteOutputUsdPerMillion = parseFloat(remoteModel.pricing.completion || "0") * 1_000_000;

            const remoteInputNgN = Number((remoteInputUsdPerMillion * usdToNgnRate).toFixed(2));
            const remoteOutputNgN = Number((remoteOutputUsdPerMillion * usdToNgnRate).toFixed(2));

            // 5% drift threshold to prevent minor daily FX moves from triggering false alerts
            const DRIFT_THRESHOLD_RATIO = 0.05;

            const inputDiffRatio = Math.abs(remoteInputNgN - localModel.pricing.inputNgNPerMillionTokens) / localModel.pricing.inputNgNPerMillionTokens;
            const outputDiffRatio = Math.abs(remoteOutputNgN - localModel.pricing.outputNgNPerMillionTokens) / localModel.pricing.outputNgNPerMillionTokens;

            // Check Input Price Drift
            if (inputDiffRatio > DRIFT_THRESHOLD_RATIO) {
                driftAlerts.push({
                    model: localModel.id,
                    type: "input",
                    localNgNPerMillionTokens: localModel.pricing.inputNgNPerMillionTokens,
                    remoteNgNPerMillionTokens: remoteInputNgN,
                });
            }

            // Check Output Price Drift
            if (outputDiffRatio > DRIFT_THRESHOLD_RATIO) {
                driftAlerts.push({
                    model: localModel.id,
                    type: "output",
                    localNgNPerMillionTokens: localModel.pricing.outputNgNPerMillionTokens,
                    remoteNgNPerMillionTokens: remoteOutputNgN,
                });
            }
        }

        if (driftAlerts.length > 0) {
            console.warn(`[PRICE DRIFT DETECTED] ${driftAlerts.length} discrepancy alerts:`, driftAlerts);
        } else {
            console.log(`[PRICE DRIFT CHECK] Models synchronized (Rate: ₦${usdToNgnRate}/USD).`);
        }

        return driftAlerts;
    } catch (error) {
        console.error("[PRICE DRIFT ERROR] Failed to perform price check:", error);
        return [];
    }
}