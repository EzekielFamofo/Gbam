"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Crown, Rocket, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getEffectiveNgnPerCredit,
  getSavingsPercent,
  getTotalCredits,
  type CreditPack,
  type CreditPackId,
} from "@gbam/shared";
import { CreditBar } from "./credit-bar";

const TIER_ICONS: Record<CreditPackId, typeof Sparkles> = {
  starter: Sparkles,
  builder: Rocket,
  pro: Crown,
} as const;

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
  "Works with every supported model",
  "Credits expire after 6 months",
  "Full CLI + dashboard sync",
  "Transparent credit-level metering",
];

export function PricingCard({
  pack,
  maxTotal,
}: {
  pack: CreditPack;
  maxTotal: number;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const Icon = TIER_ICONS[pack.id] || Sparkles;
  const total = getTotalCredits(pack);
  const rate = getEffectiveNgnPerCredit(pack);
  const savings = getSavingsPercent(pack);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsFocused(true)}
      onMouseLeave={() => setIsFocused(false)}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-3xl border p-7 transition-colors duration-300",
        pack.highlighted
          ? "border-primary/50 bg-primary/[0.07] shadow-[0_0_35px_-5px_rgba(57,255,136,0.22),0_18px_70px_rgba(0,0,0,0.28)]"
          : "border-border/70 bg-card/70 hover:border-border/90 hover:bg-card/90 shadow-[0_18px_70px_rgba(0,0,0,0.22)]"
      )}
    >
      {/* Cursor Spotlight Effect */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300"
        style={{
          opacity: isFocused ? 1 : 0,
          background: `radial-gradient(450px circle at ${position.x}px ${position.y}px, ${
            pack.highlighted
              ? "rgba(57, 255, 136, 0.14)"
              : "rgba(255, 255, 255, 0.05)"
          }, transparent 40%)`,
        }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          {/* Header & Most Popular Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Icon className="size-5 text-primary" />
              <h3 className="font-display text-xl font-semibold tracking-tight">
                {pack.label}
              </h3>
            </div>
            {pack.highlighted && (
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary shadow-[0_0_12px_rgba(57,255,136,0.2)]">
                Most popular
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-muted-foreground min-h-[40px]">
            {pack.tagline}
          </p>

          {/* Pricing */}
          <div className="mt-6">
            <span className="font-display text-4xl font-semibold tracking-tight">
              {nairaFormatter.format(pack.retailPriceNgn)}
            </span>
            <span className="ml-1.5 text-sm text-muted-foreground">one-time</span>
          </div>

          {/* Value Anchor Line driven by shared pack config */}
          {pack.capacityEstimate && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-primary/90 font-medium bg-primary/5 border border-primary/20 rounded-lg px-2.5 py-1.5">
              <Zap className="size-3.5 shrink-0 text-primary" />
              <span>{pack.capacityEstimate}</span>
            </div>
          )}

          {/* Credit Details */}
          <div className="mt-5 space-y-2">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">
                {pack.baseCredits.toLocaleString()} credits
              </span>
              <div className="flex items-center gap-1.5">
                {pack.bonusCredits > 0 && (
                  <span className="rounded-md bg-primary/20 px-1.5 py-0.5 text-[11px] font-bold text-primary">
                    +{pack.bonusCredits.toLocaleString()} FREE
                  </span>
                )}
                <span className="font-semibold text-foreground">
                  {total.toLocaleString()} total
                </span>
              </div>
            </div>
            <CreditBar
              baseCredits={pack.baseCredits}
              bonusCredits={pack.bonusCredits}
              maxTotal={maxTotal}
            />
            <div className="flex items-baseline justify-between text-xs text-muted-foreground">
              <span>{rateFormatter.format(rate)} / credit</span>
              {savings > 0 && (
                <span className="font-medium text-primary">
                  {savings}% lower unit rate
                </span>
              )}
            </div>
          </div>

          {/* Features */}
          <ul className="mt-6 space-y-2.5">
            {commonFeatures.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button */}
        <Link href={`/api/dashboard/checkout?pack=${pack.id}`} className="mt-7 block">
          <Button
            size="lg"
            variant={pack.highlighted ? "default" : "outline"}
            className={cn(
              "w-full font-semibold transition-all duration-200",
              pack.highlighted
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(57,255,136,0.25)]"
                : "border-border/80 bg-background/50 hover:border-primary/40 hover:bg-accent/40"
            )}
          >
            Get {pack.label}
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}