import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ArrowLeft, ExternalLink, ShieldCheck, Terminal } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DashboardSummaryCards } from "./_components/dashboard-summary";
import { RecentSessions } from "./_components/recent-sessions";
import { RecentTransactions } from "./_components/recent-transactions";
import { getDashboardData } from "@/lib/dashboard/get-dashboard";

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

  let dashboardData = null;
  let dashboardError: string | null = null;

  try {
    dashboardData = await getDashboardData(userId);
  } catch (error) {
    dashboardError = error instanceof Error ? error.message : "Failed to load dashboard";
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-1 font-display text-lg font-semibold tracking-tight">
            GBAM
            <span className="text-primary motion-safe:animate-pulse">_</span>
          </Link>

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
        <section className="rounded-3xl border border-border bg-card p-7">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <ShieldCheck className="size-3.5" />
                Dashboard linked to your CLI account
              </div>
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                  Welcome back, {name}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                  This dashboard is intentionally simple: live credits balance, recent CLI sessions, and usage history tied to the same Clerk account you use on the web.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>{email}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <UserButton />
              <Link href="/api/dashboard/checkout">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Buy credits
                </Button>
              </Link>
              <Link href="/get-started">
                <Button variant="outline">
                  Open setup guide
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {dashboardError || !dashboardData ? (
          <section className="mt-6 rounded-3xl border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold">Dashboard temporarily unavailable</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {dashboardError ?? "The dashboard data could not be loaded right now."}
                </p>
              </div>
              <Terminal className="size-5 text-primary" />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/docs">
                <Button variant="outline" className="gap-2">
                  Read docs <ExternalLink className="size-4" />
                </Button>
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="mt-6">
              <DashboardSummaryCards summary={dashboardData.summary} />
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <RecentSessions sessions={dashboardData.sessions} />
              <RecentTransactions transactions={dashboardData.transactions} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
