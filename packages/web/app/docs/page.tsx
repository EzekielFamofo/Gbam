import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  KeyRound,
  Layers,
  ShieldCheck,
  Terminal,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const sectionLinks = [
  { id: "overview", label: "Overview" },
  { id: "install", label: "Install" },
  { id: "auth", label: "Web-linked auth" },
  { id: "modes", label: "Modes" },
  { id: "sessions", label: "Sessions" },
  { id: "models", label: "Models" },
  { id: "dashboard", label: "Dashboard & billing" },
  { id: "safety", label: "Safety" },
  { id: "troubleshooting", label: "Troubleshooting" },
];

const supportedModels = [
  "gpt-4o",
  "gpt-4.1",
  "gpt-5.4",
  "gpt-5-codex",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite",
];

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3 font-mono text-sm text-primary">
      {children}
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-1 font-display text-lg font-semibold tracking-tight">
            GBAM
            <span className="text-primary motion-safe:animate-pulse">_</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">Dashboard</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="size-4" /> Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Workflow className="size-3.5" />
            CLI-first product docs
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Documentation for the GBAM CLI + web workflow
          </h1>
          <p className="text-lg text-muted-foreground">
            These docs focus on the actual product shape: a terminal-native coding agent with a linked web app for identity, onboarding, billing, and future session visibility.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                On this page
              </p>
              <nav className="space-y-1">
                {sectionLinks.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                  >
                    {section.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <main className="space-y-16">
            <section id="overview" className="scroll-mt-28 space-y-5">
              <div className="flex items-center gap-3 text-primary">
                <Terminal className="size-5" />
                <h2 className="font-display text-2xl font-semibold">Overview</h2>
              </div>
              <p className="text-muted-foreground leading-7">
                GBAM is designed around a simple idea: the CLI should stay close to your repository, while the web app should handle everything that benefits from a browser surface—authentication, account management, billing, onboarding, and eventually session review.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="font-display text-sm font-semibold text-primary">CLI</p>
                  <p className="mt-2 text-sm text-muted-foreground">Prompts, tool execution, streaming responses, and direct work inside the repo.</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="font-display text-sm font-semibold text-primary">Server</p>
                  <p className="mt-2 text-sm text-muted-foreground">Chat orchestration, auth verification, session persistence, and usage metering.</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="font-display text-sm font-semibold text-primary">Web app</p>
                  <p className="mt-2 text-sm text-muted-foreground">Docs, sign-in, dashboard, and the browser side of the CLI authentication flow.</p>
                </div>
              </div>
            </section>

            <section id="install" className="scroll-mt-28 space-y-5">
              <h2 className="font-display text-2xl font-semibold">Install</h2>
              <p className="text-muted-foreground leading-7">
                Install the CLI globally, then authenticate it from the browser so it can operate under the same account you use on the site.
              </p>
              <CodeBlock>$ npm i -g gbam-dev</CodeBlock>
              <CodeBlock>$ gbam</CodeBlock>
              <p className="text-sm text-muted-foreground">
                After running GBAM, press <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">/</code> to access the command menu for task navigation and execution.
              </p>
            </section>

            <section id="auth" className="scroll-mt-28 space-y-5">
              <div className="flex items-center gap-3 text-primary">
                <KeyRound className="size-5" />
                <h2 className="font-display text-2xl font-semibold">Web-linked auth</h2>
              </div>
              <p className="text-muted-foreground leading-7">
                GBAM uses the website as part of the CLI sign-in experience. When you run <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">gbam login</code>, the CLI opens the browser, the site confirms your Clerk identity, and the flow returns control back to the terminal.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="font-display text-base font-semibold">Why this matters</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    It keeps account identity, dashboard access, and CLI authentication tied together instead of treating the terminal app like a totally separate product.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="font-display text-base font-semibold">Current browser role</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    The browser currently handles sign-in, onboarding, docs, and account access. Over time it should also become the home for session history, usage reporting, and billing insights.
                  </p>
                </div>
              </div>
            </section>

            <section id="modes" className="scroll-mt-28 space-y-5">
              <div className="flex items-center gap-3 text-primary">
                <Layers className="size-5" />
                <h2 className="font-display text-2xl font-semibold">Modes</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="font-display text-base font-semibold">PLAN</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Read-only analysis mode. Use it when you want the agent to inspect, explain, trace, or propose changes without touching your files.
                  </p>
                  <div className="mt-4">
                    <CodeBlock>$ gbam --mode PLAN "explain this codebase"</CodeBlock>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="font-display text-base font-semibold">BUILD</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Full implementation mode. The agent can read files, edit code, create new files, and run shell commands through the CLI tool layer.
                  </p>
                  <div className="mt-4">
                    <CodeBlock>$ gbam --mode BUILD "add missing API validation"</CodeBlock>
                  </div>
                </div>
              </div>
            </section>

            <section id="sessions" className="scroll-mt-28 space-y-5">
              <h2 className="font-display text-2xl font-semibold">Sessions</h2>
              <p className="text-muted-foreground leading-7">
                Every prompt belongs to a session. The server keeps session metadata and message history, while the CLI handles the actual repository-local tool execution. That split makes it possible to keep browser visibility and terminal execution in sync over time.
              </p>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="font-display text-base font-semibold">Recommended mental model</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                  <li>• The CLI is the execution surface.</li>
                  <li>• The backend is the orchestration and persistence surface.</li>
                  <li>• The dashboard should become the review and account surface.</li>
                </ul>
              </div>
            </section>

            <section id="models" className="scroll-mt-28 space-y-5">
              <h2 className="font-display text-2xl font-semibold">Supported models</h2>
              <p className="text-muted-foreground leading-7">
                The current product configuration supports OpenAI and Google models. You can keep the same CLI workflow while choosing the model that fits the task.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {supportedModels.map((model) => (
                  <div key={model} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground">
                    {model}
                  </div>
                ))}
              </div>
            </section>

            <section id="dashboard" className="scroll-mt-28 space-y-5">
              <div className="flex items-center gap-3 text-primary">
                <CreditCard className="size-5" />
                <h2 className="font-display text-2xl font-semibold">Dashboard & billing</h2>
              </div>
              <p className="text-muted-foreground leading-7">
                The dashboard should become the browser control plane for your GBAM account: identity, credits, purchases, session history, and later usage analysis. Today it can already reflect authenticated account state through Clerk, and it should progressively absorb the account-level concerns that don’t belong in the terminal.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="font-display text-base font-semibold">What belongs on the dashboard</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                    <li>• Signed-in account identity</li>
                    <li>• Credit balance and purchase flow</li>
                    <li>• Session index and recent activity</li>
                    <li>• Usage trends by model and session</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="font-display text-base font-semibold">Why it should stay separate from the CLI</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Billing, account management, and historical analysis are naturally easier to understand in a browser. The CLI should remain optimized for execution speed and repo context.
                  </p>
                </div>
              </div>
            </section>

            <section id="safety" className="scroll-mt-28 space-y-5">
              <div className="flex items-center gap-3 text-primary">
                <ShieldCheck className="size-5" />
                <h2 className="font-display text-2xl font-semibold">Safety model</h2>
              </div>
              <p className="text-muted-foreground leading-7">
                GBAM’s safety model starts with separation of responsibility: the backend decides the tool request, but the CLI performs the local action. PLAN mode exists for read-only work, while BUILD mode is explicit about the fact that it can modify files and run commands.
              </p>
              <div className="rounded-2xl border border-border bg-card p-5 text-sm leading-6 text-muted-foreground">
                Use PLAN when you want inspection without edits. Use BUILD when you want direct implementation and are ready for repository changes.
              </div>
            </section>

            <section id="troubleshooting" className="scroll-mt-28 space-y-5">
              <h2 className="font-display text-2xl font-semibold">Troubleshooting</h2>
              <div className="grid gap-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="font-display text-base font-semibold">The CLI login tab opens but nothing happens</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Make sure you are signed into the website, then retry <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">gbam login</code>. The browser is part of the authentication handoff, so both the site session and terminal flow need to complete successfully.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="font-display text-base font-semibold">I want usage and credits in the dashboard</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    That requires the web dashboard to be wired to the billing and session data plane. The current site is already the right place for that feature; it just needs the next integration layer.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="font-display text-base font-semibold">Accessing the Command Menu</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    In GBAM, use <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">/</code> to bring up the command menu for easily navigating and executing tasks.
                  </p>
                  {/* Future development: Include screenshots or GIFs demonstrating command menu usage */}
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
