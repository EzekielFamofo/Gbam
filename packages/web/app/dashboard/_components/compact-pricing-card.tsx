import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  CREDIT_PACKS,
  getTotalCredits,
  getSavingsPercent,
  type CreditPack,
} from "@gbam/shared";

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

function CompactPricingCard({ pack }: { pack: CreditPack }) {
  const totalCredits = getTotalCredits(pack);
  const savingsPercent = getSavingsPercent(pack);

  return (
    <div
      className={`relative flex flex-col justify-between rounded-xl border p-4 ${
        pack.highlighted
          ? "border-primary/40 bg-primary/[0.06]"
          : "border-border/60 bg-card/60"
      }`}
    >
      {pack.highlighted ? (
        <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-background px-2 py-0.5 text-[10px] font-medium text-primary">
          <Sparkles className="size-2.5" />
          Best value
        </span>
      ) : null}

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">{pack.label}</p>
          {savingsPercent > 0 ? (
            <span className="shrink-0 text-[11px] font-medium text-primary">
              save {savingsPercent}%
            </span>
          ) : null}
        </div>

        <p className="mt-2 font-display text-xl font-semibold tracking-tight">
          {nairaFormatter.format(pack.retailPriceNgn)}
        </p>

        <p className="mt-0.5 text-xs text-muted-foreground">
          {totalCredits.toLocaleString("en-NG")} credits
        </p>
      </div>

      <Link
        href={`/api/dashboard/checkout?pack=${pack.id}`}
        className={`mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
          pack.highlighted
            ? "border-primary/30 bg-primary text-primary-foreground hover:bg-primary/90"
            : "border-border/60 bg-muted/30 text-foreground hover:bg-muted/50"
        }`}
      >
        Buy
        <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}

export function CompactCreditPacks() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {CREDIT_PACKS.map((pack) => (
        <CompactPricingCard key={pack.id} pack={pack} />
      ))}
    </div>
  );
}