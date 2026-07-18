import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  KeyRound,
  LayoutDashboard,
  ShieldCheck,
  Terminal,
  UserRound,
} from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

function formatDate(value: number | string | Date | null | undefined) {
  if (!value) return "Not available yet";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available yet";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const user = await currentUser();
  const name =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "GBAM developer";
  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "No primary email available";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const membershipDate = formatDate(user?.createdAt);
  const lastSignIn = formatDate(user?.lastSignInAt);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1 font-display text-lg font-semibold tracking-tight">
              GBAM
              <span className="text-primary motion-safe:animate-pulse">_</span>
            </Link>
            <span className="hidden rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:inline-flex">
              Dashboard linked to Clerk account state
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/docs">
              <Button variant="outline" size="sm">Docs</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="size-4" /> Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-border bg-card p-7">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 font-display text-lg font-semibold text-primary">
                  {initials || "GB"}
                </div>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <CheckCircle2 className="size-3.5" /> Authenticated with Clerk
                  </div>
                  <div>
                    <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                      Welcome back, {name}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                      This dashboard now reflects real signed-in account information from Clerk. It’s the right home for identity, onboarding, credits, session visibility, and billing controls that support the CLI.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <UserButton />
                <Link href="/get-started">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Use the CLI
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-background/60 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <UserRound className="size-4 text-primary" /> Primary identity
                </div>
                <p className="mt-3 text-base font-medium text-foreground">{email}</p>
                <p className="mt-1 text-xs text-muted-foreground">Clerk user ID: {userId}</p>
              </div>
              <div className="rounded-2xl border border-border bg-background/60 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock3 className="size-4 text-primary" /> Member since
                </div>
                <p className="mt-3 text-base font-medium text-foreground">{membershipDate}</p>
                <p className="mt-1 text-xs text-muted-foreground">Account creation timestamp from Clerk</p>
              </div>
              <div className="rounded-2xl border border-border bg-background/60 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <ShieldCheck className="size-4 text-primary" /> Last web sign-in
                </div>
                <p className="mt-3 text-base font-medium text-foreground">{lastSignIn}</p>
                <p className="mt-1 text-xs text-muted-foreground">Useful for confirming which account the CLI should link to</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-7">
            <div className="flex items-center gap-2 text-primary">
              <KeyRound className="size-5" />
              <h2 className="font-display text-xl font-semibold">CLI auth status</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The web app is already part of the CLI login flow. When you run the login command, the browser confirms your signed-in account and hands control back to the terminal.
            </p>
            <div className="mt-5 rounded-2xl border border-border bg-background/60 p-4 font-mono text-sm text-primary">
              $ gbam login
            </div>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
              <li>• Clerk manages the signed-in web identity.</li>
              <li>• The browser acts as the login bridge for the CLI.</li>
              <li>• This dashboard should become the long-term account control plane.</li>
            </ul>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-primary">
              <LayoutDashboard className="size-5" />
              <h2 className="font-display text-lg font-semibold">What is live today</h2>
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <li>• Real signed-in account identity from Clerk</li>
              <li>• Accurate membership and sign-in timestamps</li>
              <li>• A browser surface already connected to the CLI auth flow</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-primary">
              <CreditCard className="size-5" />
              <h2 className="font-display text-lg font-semibold">Credits</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Credit balance is intentionally not faked here anymore. Once the dashboard is wired to your billing data source, this card should show your real balance, top-ups, and recent usage by session.
            </p>
            <div className="mt-5 rounded-2xl border border-dashed border-border bg-background/50 p-4 text-sm text-muted-foreground">
              Billing data not yet connected in the web layer.
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-primary">
              <Terminal className="size-5" />
              <h2 className="font-display text-lg font-semibold">Sessions</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              This is the natural place to show recent CLI sessions, status, mode, and model usage—once the dashboard is connected to the session persistence layer.
            </p>
            <div className="mt-5 rounded-2xl border border-dashed border-border bg-background/50 p-4 text-sm text-muted-foreground">
              Session history not yet connected in the web layer.
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-semibold">What should be wired next</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background/60 p-4">
                <p className="font-display text-sm font-semibold text-primary">Credits + purchases</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Pull real credit balance, billing status, and payment history into the dashboard so the browser becomes the account source of truth.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background/60 p-4">
                <p className="font-display text-sm font-semibold text-primary">Recent sessions</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Show recent CLI sessions with mode, timestamps, and later token or credit summaries so users can move between terminal and browser easily.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background/60 p-4">
                <p className="font-display text-sm font-semibold text-primary">Usage analytics</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Summaries by model, project, and session will make the credit system explainable and help users optimize how they work.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background/60 p-4">
                <p className="font-display text-sm font-semibold text-primary">Account controls</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Add settings that belong at the account layer: billing actions, personal defaults, and eventually project-level preferences.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-semibold">Helpful links</h2>
            <div className="mt-5 grid gap-4">
              <Link href="/get-started" className="rounded-2xl border border-border bg-background/60 p-4 transition-colors hover:bg-background">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-base font-semibold">Install and sign in</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Follow the guided setup for installing the CLI and completing the browser-assisted login flow.
                    </p>
                  </div>
                  <ExternalLink className="mt-1 size-4 text-primary" />
                </div>
              </Link>
              <Link href="/docs" className="rounded-2xl border border-border bg-background/60 p-4 transition-colors hover:bg-background">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-base font-semibold">Read the docs</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Review the CLI and web workflow, supported models, safety modes, and dashboard direction.
                    </p>
                  </div>
                  <ExternalLink className="mt-1 size-4 text-primary" />
                </div>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
