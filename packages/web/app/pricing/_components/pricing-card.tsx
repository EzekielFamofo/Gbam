import Link from "next/link";
import { Check, Crown, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getEffectiveNgnPerCredit, getSavingsPercent, getTotalCredits, type CreditPack } from "@gbam/shared";
import { CreditBar } from "./credit-bar";

const TIER_ICONS = { starter: Sparkles, builder: Rocket, pro: Crown } as const;

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const rateFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const commonFeatures = [
  "Works with every supported model (Gemini & OpenAI)",
  "Credits never expire",
  "Full CLI + dashboard sync",
  "Per-message token-level billing, zero markups",
];

export function PricingCard({ pack, maxTotal }: { pack: CreditPack; maxTotal: number }) {
  const Icon = TIER_ICONS[pack.id];
  const total = getTotalCredits(pack);
  const rate = getEffectiveNgnPerCredit(pack);
  const savings = getSavingsPercent(pack);

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-3xl border p-7 shadow-[0_18px_70px_rgba(0,0,0,0.22)]",
        pack.highlighted
          ? "border-primary/40 bg-primary/[0.06] shadow-[0_0_0_1px_rgba(57,255,136,0.15),0_18px_70px_rgba(0,0,0,0.28)]"
          : "border-border bg-card/70"
      )}
    >
      {pack.highlighted && (
        <span className="absolute -top-3 left-7 rounded-full border border-primary/30 bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
          Most popular
        </span>
      )}

      <div className="flex items-center gap-2.5">
        <Icon className="size-5 text-primary" />
        <h3 className="font-display text-xl font-semibold tracking-tight">{pack.label}</h3>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">{pack.tagline}</p>

      <div className="mt-6">
        <span className="font-display text-4xl font-semibold tracking-tight">
          {nairaFormatter.format(pack.retailPriceNgn)}
        </span>
        <span className="ml-1.5 text-sm text-muted-foreground">one-time</span>
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">
            {pack.baseCredits.toLocaleString()} credits
            {pack.bonusCredits > 0 && (
              <span className="text-primary"> + {pack.bonusCredits.toLocaleString()} bonus</span>
            )}
          </span>
          <span className="font-semibold">{total.toLocaleString()} total</span>
        </div>
        <CreditBar baseCredits={pack.baseCredits} bonusCredits={pack.bonusCredits} maxTotal={maxTotal} />
        <div className="flex items-baseline justify-between text-xs text-muted-foreground">
          <span>{rateFormatter.format(rate)} / credit</span>
          {savings > 0 && <span className="font-medium text-primary">{savings}% better rate</span>}
        </div>
      </div>

      <ul className="mt-6 space-y-2.5">
        {commonFeatures.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
            {feature}
          </li>
        ))}
      </ul>

        <Link href={`/api/dashboard/checkout?pack=${pack.id}`} className="mt-7">
            <Button
                size="lg"
                variant={pack.highlighted ? "default" : "outline"}
                className={cn("w-full font-semibold", !pack.highlighted && "border-primary/20 hover:border-primary/40")}
            >
                Get {pack.label}
        </Button>
        </Link>
    </div>
  );
}