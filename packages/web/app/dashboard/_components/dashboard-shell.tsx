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

  const isOverview = currentPath === "/dashboard" || currentPath === "/dashboard/";

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Sleek Compact Top Bar */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-1.5 font-display text-base font-semibold tracking-tight">
              GBAM <span className="text-primary motion-safe:animate-pulse">_</span>
            </Link>
            <div className="hidden h-4 w-px bg-border sm:block" />
            <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>CLI Linked: <strong className="text-foreground">{email}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/docs">
              <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground">
                Docs
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-3.5" /> Home
              </Button>
            </Link>
            <div className="h-4 w-px bg-border mx-1" />
            <UserButton />
          </div>
        </div>
      </header>

      {/* Main Layout with Fully Vertical Sidebar */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Fully Vertical Sidebar */}
          <aside className="space-y-4">
            <div className="sticky top-20 rounded-xl border border-border/60 bg-card/40 p-3">
              <div className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                Navigation
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.href;
                  const classes = cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary/15 text-primary border border-primary/20 font-semibold"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    item.disabled && "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-muted-foreground"
                  );

                  if (item.disabled) {
                    return (
                      <div key={item.href} className={classes} aria-disabled="true">
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                        <span className="ml-auto text-[9px] uppercase tracking-wide opacity-70">Soon</span>
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
            </div>
          </aside>

          {/* Content Area */}
          <main className="space-y-6">
            {/* Welcome banner only on overview page, setup guide removed */}
            {isOverview && (
              <section className="rounded-xl border border-border/60 bg-card/60 p-5 shadow-xs">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                      <ShieldCheck className="size-3" />
                      CLI Synchronized
                    </div>
                    <h1 className="font-display text-2xl font-semibold tracking-tight">
                      Welcome back, {name}
                    </h1>
                    <p className="text-xs text-muted-foreground">
                      Manage credits, view active CLI sessions, and monitor usage telemetry.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Link href="/api/dashboard/checkout">
                      <Button size="sm" className="h-8 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90">
                        Buy credits
                      </Button>
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {children}
          </main>
        </div>
      </div>
    </div>
  );
}