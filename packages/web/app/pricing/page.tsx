import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { CREDIT_PACKS, getTotalCredits } from "@gbam/shared";
import { PricingCard } from "./_components/pricing-card";
import { ModelCostTable } from "./_components/model-cost-table";

export const metadata = {
  title: "Pricing — GBAM",
  description:
    "Pay-as-you-go credit packs for the GBAM terminal AI assistant. No monthly subscriptions — buy credits that only expire after 6 months.",
};

export default function PricingPage() {
  const maxTotal = Math.max(...CREDIT_PACKS.map(getTotalCredits));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(57,255,136,0.18),transparent_34%)]" />
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-medium text-primary shadow-[0_0_0_1px_rgba(57,255,136,0.12),0_0_30px_rgba(57,255,136,0.12)]">
                💳 Simple, transparent, pay-as-you-go
              </div>
              <h1 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                Buy credits once. Use them whenever.
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
                No monthly subscription, no auto-renewal. Bigger packs come with bonus credits and a better
                rate per credit — pick the one that matches how much you code.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-card/35">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="grid gap-6 md:grid-cols-3">
              {CREDIT_PACKS.map((pack) => (
                <PricingCard key={pack.id} pack={pack} maxTotal={maxTotal} />
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="rounded-3xl border border-border bg-card/70 p-8 text-center shadow-[0_18px_70px_rgba(0,0,0,0.22)] backdrop-blur md:p-12">
              <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Ready to get started?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Install the CLI, link your account, and buy your first credit pack in under two minutes.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/get-started">
                  <Button size="lg" className="gap-2 font-semibold">
                    Get started <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="border-primary/20 hover:border-primary/40">
                    Open dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}