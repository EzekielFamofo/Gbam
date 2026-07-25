import { z } from "zod";

export const creditPackIdSchema = z.enum(["starter", "builder", "pro"]);
export type CreditPackId = z.infer<typeof creditPackIdSchema>;

// ...rest of the file (CreditPack, CREDIT_PACKS, getTotalCredits, etc.) unchanged

export type CreditPack = {
  id: CreditPackId;
  label: string;
  retailPriceNgn: number;
  baseCredits: number;
  bonusCredits: number;
  highlighted?: boolean;
  tagline: string;
};

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "starter",
    label: "Starter",
    retailPriceNgn: 7_000,
    baseCredits: 500,
    bonusCredits: 0,
    tagline: "Try GBAM properly before committing to more.",
  },
  {
    id: "builder",
    label: "Builder",
    retailPriceNgn: 21_000,
    baseCredits: 1_500,
    bonusCredits: 100,
    highlighted: true,
    tagline: "The sweet spot for daily coding sessions.",
  },
  {
    id: "pro",
    label: "Pro",
    retailPriceNgn: 50_000,
    baseCredits: 3_500,
    bonusCredits: 500,
    tagline: "Heavy, multi-project usage at the best rate per credit.",
  },
];

export function getTotalCredits(pack: CreditPack): number {
  return pack.baseCredits + pack.bonusCredits;
}

export function getEffectiveNgnPerCredit(pack: CreditPack): number {
  return pack.retailPriceNgn / getTotalCredits(pack);
}

// Savings are measured against the Starter tier's rate (the one with zero
// bonus credits), so this is always derived — never a second hardcoded number
// that could drift from the pack data above.
export function getSavingsPercent(pack: CreditPack, baseline: CreditPack = CREDIT_PACKS[0]): number {
  const baselineRate = getEffectiveNgnPerCredit(baseline);
  const rate = getEffectiveNgnPerCredit(pack);
  return Math.round(((baselineRate - rate) / baselineRate) * 100);
}