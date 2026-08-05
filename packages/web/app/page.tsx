import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { DemoShowcase, InstallCommandCard } from "@/components/home-cta";
import { Button } from "@/components/ui/button";
import { FAQSection } from "@/components/faq";

const trustBadges = [
  "🔒 Set hard spending caps anytime in dashboard settings",
  "💳 No dollar card required — pay straight in Naira",
];

const comparisonStats = [
  {
    label: "Traditional AI Coding Subscriptions",
    value: "₦28,000 / month",
    detail: "Fixed flat fee",
  },
  {
    label: "GBAM Average Developer Usage",
    value: "~₦4,500 / month",
    detail: "Pay strictly for exact token usage",
    highlight: true,
  },
];

const features = [
  {
    title: "🪙 Pay-As-You-Go Token Pricing",
    description:
      "Forget ₦28,000/month flat fees. GBAM uses an internal token ledger so you only pay for what you actually use.",
  },
  {
    title: "🇳🇬 Direct Naira Billing",
    description:
      "Get rid of the hassle of finding dollar cards and dealing with volatile exchange rates. Top up your balance directly in local currency.",
  },
  {
    title: "🔄 Seamless CLI + Web Dashboard Sync",
    description:
      "Start a session in your terminal, inspect history, token breakdowns, and metrics live on the web dashboard.",
  },
  {
    title: "📊 Granular Token & Cost Tracking",
    description:
      "Full visibility into input and output tokens per message. Zero hidden markups, zero opaque limits.",
  },
  {
    title: "⚡ Instant Shell Onboarding",
    description:
      "One command npm install for macOS, Linux, and Windows with `npm i -g gbam-dev`.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-background text-foreground">
      <Navbar />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(57,255,136,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(57,255,136,0.08),transparent_30%)]" />
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-medium text-primary shadow-[0_0_0_1px_rgba(57,255,136,0.12),0_0_30px_rgba(57,255,136,0.12)]">
                ⚡ Live Token Tracking • No Monthly Subscriptions
              </div>

              <h1 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
                The Terminal AI Assistant You Pay for Only When You Code.
              </h1>

              <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
                Stop burning ₦28,000/month on fixed subscriptions. GBAM pairs a
                lightning-fast CLI with a live web dashboard—tracking exact
                input/output tokens while getting rid of the hassle of finding
                dollar cards and dealing with volatile exchange rates.
              </p>

              <div className="mx-auto mt-10 max-w-3xl">
                <InstallCommandCard />
              </div>

              <div className="mt-5 flex justify-center">
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary/20 bg-background/80 hover:border-primary/40 hover:bg-primary/5"
                  >
                    Open Web Dashboard →
                  </Button>
                </Link>
              </div>

              <div className="mt-7 flex flex-col items-center gap-3 text-sm text-muted-foreground md:flex-row md:justify-center md:gap-6">
                {trustBadges.map((badge) => (
                  <div
                    key={badge}
                    className="rounded-full border border-border bg-card/70 px-4 py-2 backdrop-blur"
                  >
                    {badge}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-card/35">
          <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
            <div className="rounded-3xl border border-border bg-card/70 p-8 shadow-[0_18px_80px_rgba(0,0,0,0.32)] backdrop-blur">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-sm font-medium text-primary">
                    COST COMPARISON
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                    Subscription vs. Pay-As-You-Go
                  </h2>
                  <p className="mt-3 text-muted-foreground">
                    Most tools charge you 28,000/month whether you use them or
                    not. With GBAM, you buy credits once, and they expire after
                    6 months. Upon first signing in, you recieve 100 free trial
                    credits to test the assistant.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  Average usage stays dramatically below the flat-fee model.
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {comparisonStats.map((stat) => (
                  <div
                    key={stat.label}
                    className={[
                      "rounded-2xl border p-6",
                      stat.highlight
                        ? "border-primary/25 bg-primary/8 shadow-[0_0_0_1px_rgba(57,255,136,0.08)]"
                        : "border-border bg-background/60",
                    ].join(" ")}
                  >
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {stat.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-medium text-primary">DEMO SHOWCASE</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Watch the CLI and dashboard stay in sync.
              </h2>
              <p className="mt-4 text-muted-foreground">
                A single coding session should show exactly what happened, how
                many credits were consumed, and what it cost—without waiting for
                the end of the month.
              </p>
            </div>

            <div className="mt-10">
              <DemoShowcase />
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-medium text-primary">CORE FEATURES</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Built for developers who want precision, not another fixed SaaS
                bill.
              </h2>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-3xl border border-border bg-card/70 p-7 shadow-[0_18px_70px_rgba(0,0,0,0.22)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-display text-xl font-semibold tracking-tight">
                      {feature.title}
                    </h3>
                    <ArrowRight className="mt-1 size-5 text-primary" />
                  </div>
                  <p className="mt-4 leading-7 text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FAQSection />
      </main>

      {/* FOOTER SECTION */}
      <footer className="border-t border-border bg-card/40 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Column 1: Brand Info */}
            <div className="space-y-3">
              <span className="font-display text-xl font-bold tracking-tight text-primary">
                GBAM
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The terminal AI assistant you pay for only when you code. Direct
                Naira billing, zero monthly sub commitments.
              </p>
            </div>

            {/* Column 2: Navigation */}
            <div>
              <h4 className="text-sm font-semibold text-foreground tracking-wider uppercase">
                Product
              </h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/dashboard"
                    className="transition hover:text-primary"
                  >
                    Web Dashboard
                  </Link>
                </li>
                <li>
                  <a href="/docs" className="transition hover:text-primary">
                    Docs
                  </a>
                </li>
                <li>
                  <a href="#faq" className="transition hover:text-primary">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3 & 4: Contact Us */}
            <div className="space-y-4 lg:col-span-2">
              <h4 className="text-sm font-semibold text-foreground tracking-wider uppercase">
                Contact Us
              </h4>
              <p className="text-sm text-muted-foreground">
                Have questions about token pricing, account issues, or feature
                requests? Reach out to our support team anytime.
              </p>
              <div className="inline-flex items-center gap-3 rounded-2xl border border-border bg-card/80 p-4 text-sm transition hover:border-primary/40">
                <div className="rounded-xl border border-primary/20 bg-primary/10 p-2.5 text-primary">
                  <Mail className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Customer Support Email
                  </p>
                  <a
                    className="font-medium text-foreground transition-colors hover:text-primary"
                  >
                    customersupport@gbam.dev
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} GBAM. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}