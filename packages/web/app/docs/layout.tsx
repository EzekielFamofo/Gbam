import Link from "next/link";
import { ArrowLeft, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocsSidebar } from "./_components/docs-sidebar";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
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
            GBAM CLI user manual
          </h1>
          <p className="text-lg leading-8 text-muted-foreground">
            GBAM is a terminal chat app for working with AI conversations and real project context.
            The CLI is the part of the system that can access your local repository, read and edit
            files, and run local commands. The server handles authentication, persistence, model
            orchestration, billing, and streamed responses.
          </p>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <DocsSidebar />
          </aside>
          <main className="space-y-12">{children}</main>
        </div>
      </div>
    </div>
  );
}