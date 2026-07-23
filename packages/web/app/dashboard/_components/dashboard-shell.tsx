import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { SignIn, UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ArrowLeft, BarChart3, Gauge, Layers3, ListChecks, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: Gauge },
  { href: "/dashboard/sessions", label: "Sessions", icon: ListChecks },
  { href: "/dashboard/usage", label: "Usage", icon: BarChart3 },
  { href: "/dashboard/limits", label: "Limits", icon: Layers3, disabled: true },
];

export async function DashboardShell({
  currentPath,
  children,
}: {
  currentPath: string;
  children: ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="min-h-screen bg-background px-6 py-16 text-foreground selection:bg-primary/20">
        <div className="mx-auto flex max-w-6xl justify-between gap-4">
          <Link href="/" className="flex items-center gap-1 font-display text-lg font-semibold tracking-tight">
            GBAM
            <span className="text-primary motion-safe:animate-pulse">_</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="size-4" /> Home
            </Button>
          </Link>
        </div>

        <div className="mx-auto mt-12 flex max-w-6xl justify-center">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 space-y-2 text-center">
              <p className="text-sm font-medium text-primary">Dashboard access</p>
              <h1 className="font-display text-2xl font-semibold tracking-tight">Sign in to open your dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Use the same account you connect to the GBAM CLI so your sessions, credits, and billing stay in sync.
              </p>
            </div>
            <SignIn forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard" />
          </div>
        </div>
      </div>
    );
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

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
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

      <main className="mx-auto max-w-7xl px-6 py-8 md:py-10">
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
                  Manage your GBAM account with focused dashboard pages for credits, sessions, and usage.
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
                <Button variant="outline">Open setup guide</Button>
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-border bg-card p-4 lg:sticky lg:top-24 lg:self-start">
            <div className="mb-3 px-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Dashboard
            </div>
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.href;
                const classes = cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  item.disabled && "cursor-not-allowed opacity-60 hover:bg-transparent hover:text-muted-foreground",
                );

                if (item.disabled) {
                  return (
                    <div key={item.href} className={classes} aria-disabled="true">
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                      <span className="ml-auto text-[10px] uppercase tracking-wide">Soon</span>
                    </div>
                  );
                }

                return (
                  <Link key={item.href} href={item.href} className={classes}>
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          <div>{children}</div>
        </div>
      </main>
    </div>
  );
}