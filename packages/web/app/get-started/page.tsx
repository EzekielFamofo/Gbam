import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Terminal, Check, Shield, Zap, Sparkles } from "lucide-react";
import { ClientButton } from "./ClientButton";

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Header */}
      <header className="border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-1 font-display text-lg font-semibold tracking-tight">
            GBAM
            <span className="text-primary animate-pulse">_</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="size-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 md:py-20">
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            Quick Setup Guide
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Get Started with GBAM
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Get your terminal coding agent set up and running in less than two minutes.
          </p>
        </div>

        <div className="mt-16 space-y-12">
          {/* Step 1 */}
          <div className="relative border-l-2 border-primary/20 pl-8 md:pl-12">
            <div className="absolute -left-[13px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground font-display">
              1
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Install the Global CLI
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  GBAM is distributed via npm and runs inside your existing workspace terminal.
                </p>
              </div>
              <div className="relative group">
                <ClientButton label="npm i -g gbam-dev" />
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative border-l-2 border-primary/20 pl-8 md:pl-12">
            <div className="absolute -left-[13px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground font-display">
              2
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Authenticate your Client
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Connect your CLI with your dashboard account to sync context and sessions.
                </p>
              </div>
              <ClientButton label="gbam login" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative border-l-2 border-primary/20 pl-8 md:pl-12">
            <div className="absolute -left-[13px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground font-display">
              3
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Launch your First Session
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Start in read-only (PLAN) or directly write (BUILD) modes to analyze or upgrade codebases.
                </p>
              </div>
              <ClientButton label="gbam --mode PLAN \"explain this codebase\"" />
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-border pt-12">
          <Link href="/dashboard">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/docs">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Read Documentation
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}