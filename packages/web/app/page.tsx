import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CreditCard,
  Globe,
  ShieldCheck,
  TerminalSquare,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { TerminalPreview } from "@/components/terminal-preview";

const features = [
  {
    title: "Terminal-native execution",
    description:
      "GBAM runs where your code already lives, so the agent can inspect files, edit source, and run commands inside the repo instead of inside a detached browser sandbox.",
    icon: TerminalSquare,
  },
  {
    title: "Safe mode switching",
    description:
      "Start in PLAN mode when you want read-only analysis, then move into BUILD mode when you're ready for direct implementation and verification.",
    icon: ShieldCheck,
  },
  {
    title: "Shared web + CLI identity",
    description:
      "Sign in once with Clerk and keep the browser dashboard, docs, and CLI login flow tied to the same account and session context.",
    icon: Globe,
  },
  {
    title: "Usage-based credits",
    description:
      "Credits are designed around actual model usage so you can control cost without locking your team into a single provider or workflow.",
    icon: CreditCard,
  },
  {
    title: "Model-aware orchestration",
    description:
      "Choose the right model for the job, from quick repository scans to deeper implementation work, while keeping the same agent workflow.",
    icon: BrainCircuit,
  },
  {
    title: "Traceable execution flow",
    description:
      "GBAM is built around a loop you can reason about: prompt, inspect, tool call, result, and follow-up—ideal for future auditing and dashboard visibility.",
    icon: Workflow,
  },
];

const workflow = [
  {
    step: "01",
    title: "Start from the terminal",
    description:
      "Open your project, run GBAM, and give it a task. Use `/` to access the command menu for task navigation and execution.",
  },
  {
    step: "02",
    title: "Let the agent inspect and act",
    description:
      "The backend streams reasoning and tool intents while the CLI executes local repository tools such as file reads, edits, directory scans, and shell commands.",
  },
  {
    step: "03",
    title: "Review from the web",
    description:
      "Use the website for authentication, onboarding, dashboard visibility, and the account layer that sits above your terminal sessions.",
  },
];

const surfaces = [
  {
    title: "CLI",
    description: "The primary workspace for prompts, execution, and local tool access.",
  },
  {
    title: "Dashboard",
    description: "The account surface for identity, billing, and eventually sessions, usage, and audit history.",
  },
  {
    title: "Docs",
    description: "The shared reference for modes, auth flow, model support, and best practices.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(57,255,136,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(57,255,136,0.08),transparent_28%)]" />
        <div className="mx-auto grid max-w-6xl gap-16 px-6 py-24 md:grid-cols-[1.15fr_0.85fr] md:py-32">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" />
              CLI-native coding agent with a linked web account layer
            </div>

            <div className="space-y-5">
              <p className="font-display text-sm text-primary">$ gbam</p>
              <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
                Your coding agent in the terminal,
                <br />
                with the web experience it actually needs.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
                GBAM is built for developers who want real repository access in the CLI and a connected website for auth, docs, account state, and billing visibility.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/get-started">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Get started
                </Button>
              </Link>
              <Link href="/docs">
                <Button size="lg" variant="outline">
                  Explore the docs
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="ghost" className="group">
                  Open dashboard
                  <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              {surfaces.map((surface) => (
                <div key={surface.title} className="rounded-2xl border border-border bg-card/70 p-4 backdrop-blur-sm">
                  <p className="font-display text-sm font-semibold text-primary">{surface.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{surface.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-end">
            <TerminalPreview />
          </div>
        </div>
      </section>

      <section id="features" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-2xl space-y-3">
            <p className="font-display text-sm text-primary">Why GBAM</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Built for how agentic coding actually works
            </h2>
            <p className="text-muted-foreground">
              The product is intentionally split between a repository-aware CLI and a web layer that handles identity, onboarding, billing, and account visibility.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="space-y-4">
              <p className="font-display text-sm text-primary">Workflow</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                A product shaped around the terminal, not retrofitted to it
              </h2>
              <p className="text-muted-foreground">
                GBAM’s web app exists to support the CLI—not replace it. That means authentication, account controls, credits, and future session visibility can all live on the web while execution stays close to your code.
              </p>
            </div>

            <div className="grid gap-4">
              {workflow.map((item) => (
                <div key={item.step} className="rounded-2xl border border-border bg-card p-6">
                  <div className="text-sm font-semibold text-primary">{item.step}</div>
                  <h3 className="mt-2 font-display text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="font-display text-sm text-primary">Pricing & credits</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                A usage-based credit model that fits an agent workflow
              </h2>
              <p className="text-muted-foreground">
                Instead of treating every task the same, GBAM is designed around prepaid credits tied to model usage. That makes it easier to budget, meter, and eventually surface meaningful usage data in the dashboard.
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">See dashboard direction</Button>
            </Link>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-lg font-semibold">Prepaid credits</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Buy credits in the browser, then spend them from the CLI while switching between supported models and modes.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-lg font-semibold">Single account surface</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Your website account is the control plane for signing in, reading docs, managing billing, and reviewing the health of your CLI-linked workspace.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-lg font-semibold">Built for transparency</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                The long-term goal is a dashboard that shows where credits went, which sessions used them, and which workflows need optimization.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-24 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="font-display text-sm text-primary">Ready to try it</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Sign in on the web. Work from the terminal.
            </h2>
            <p className="text-muted-foreground">
              Start with the docs, authenticate through the browser, and keep GBAM close to the repository you’re actually trying to change.
            </p>
            {/* Future development: Include screenshots or GIFs showing actual command menu usage here */}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/get-started">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Install GBAM
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline">
                Read the docs
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
