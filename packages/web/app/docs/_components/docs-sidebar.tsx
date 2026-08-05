"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sectionLinks = [
  { href: "/docs", label: "Overview" },
  { href: "/docs/install", label: "Install & first run" },
  { href: "/docs/commands", label: "Commands" },
  { href: "/docs/auth", label: "Sign in & auth" },
  { href: "/docs/sessions", label: "Sessions" },
  { href: "/docs/models", label: "Models" },
  { href: "/docs/agents", label: "AGENTS.md" },
  { href: "/docs/tools", label: "Local tools" },
  { href: "/docs/permissions", label: "Permissions" },
  { href: "/docs/dashboard", label: "Dashboard & billing" },
  { href: "/docs/safety", label: "Safety boundaries" },
  { href: "/docs/troubleshooting", label: "Troubleshooting" },
];

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="rounded-3xl border border-border bg-card p-4">
      <p className="px-2 pb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        On this page
      </p>
      <div className="space-y-1">
        {sectionLinks.map((section) => {
          const isActive = pathname === section.href;
          return (
            <Link
              key={section.href}
              href={section.href}
              className={`block rounded-xl px-3 py-2 text-sm transition ${
                isActive
                  ? "bg-primary/10 text-primary font-medium border border-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {section.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}