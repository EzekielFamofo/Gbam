import { z } from "zod";

export const creditPackIdSchema = z.enum(["starter", "builder", "pro"]);
export type CreditPackId = z.infer<typeof creditPackIdSchema>;

// Free credits granted to new developers upon sign-up to eliminate onboarding friction
export const FREE_TRIAL_CREDITS = 50;

export type CreditPack = {
  id: CreditPackId;
  label: string;
  retailPriceNgn: number;
  baseCredits: number;
  bonusCredits: number;
  highlighted?: boolean;
  tagline: string;
  capacityEstimate: string; // Tangible value anchor for developers
};

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "starter",
    label: "Starter",
    retailPriceNgn: 7_000,
    baseCredits: 500,
    bonusCredits: 0,
    tagline: "Try GBAM properly before committing to more.",
    capacityEstimate: "~100 CLI prompts or ~1.5M Gemini Flash tokens",
  },
  {
    id: "builder",
    label: "Builder",
    retailPriceNgn: 21_000,
    baseCredits: 1_500,
    bonusCredits: 250, // 1,750 total credits = ₦12.00/credit (14% rate discount)
    highlighted: true,
    tagline: "The sweet spot for daily active coding sessions.",
    capacityEstimate: "~350 CLI prompts • Ideal for daily terminal coding",
  },
  {
    id: "pro",
    label: "Pro",
    retailPriceNgn: 50_000,
    baseCredits: 3_500,
    bonusCredits: 1_000, // 4,500 total credits = ₦11.11/credit (21% rate discount)
    tagline: "Heavy, multi-project usage at the best rate per credit.",
    capacityEstimate: "~1,000 heavy agentic queries & multi-file refactors",
  },
];

export function getTotalCredits(pack: CreditPack): number {
  return pack.baseCredits + pack.bonusCredits;
}

export function getEffectiveNgnPerCredit(pack: CreditPack): number {
  const totalCredits = getTotalCredits(pack);
  if (totalCredits === 0) return 0;
  return pack.retailPriceNgn / totalCredits;
}

// Savings are measured against the Starter tier's rate (the one with zero
// bonus credits), so this is always derived — never a second hardcoded number
// that could drift from the pack data above.
export function getSavingsPercent(
  pack: CreditPack,
  baseline: CreditPack = CREDIT_PACKS[0]
): number {
  const baselineRate = getEffectiveNgnPerCredit(baseline);
  const rate = getEffectiveNgnPerCredit(pack);
  if (baselineRate === 0) return 0;
  return Math.round(((baselineRate - rate) / baselineRate) * 100);
}