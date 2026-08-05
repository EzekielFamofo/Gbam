import { Terminal } from "lucide-react";
import { SectionCard } from "./_components/docs-ui";


export default function DocsOverviewPage() {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3 text-primary">
        <Terminal className="size-5" />
        <h2 className="font-display text-2xl font-semibold">Overview</h2>
      </div>
      <p className="leading-7 text-muted-foreground">
        GBAM is designed around a strict responsibility split. The backend decides what the
        model should do and persists the conversation, but your local CLI is the only part
        allowed to touch your project files. That makes the terminal app the main user-facing
        product for coding work, while the website supports account, billing, permissions, and
        dashboard flows.
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SectionCard>
          <p className="font-display text-base font-semibold">Core features</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
            <li>Start a new conversation</li>
            <li>Continue an existing session</li>
            <li>Browse and reopen session history</li>
            <li>Rename sessions</li>
            <li>Choose agent mode and model</li>
          </ul>
        </SectionCard>
        <SectionCard>
          <p className="font-display text-base font-semibold">Project-aware workflow</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
            <li>Reads local repository files</li>
            <li>Uses local tool execution for side effects</li>
            <li>Forwards your repo guidance from AGENTS.md</li>
            <li>Keeps tool access scoped to your selected project</li>
          </ul>
        </SectionCard>
        <SectionCard>
          <p className="font-display text-base font-semibold">What the website adds</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
            <li>Browser-based sign-in</li>
            <li>Usage and billing surfaces</li>
            <li>Permission and spending controls</li>
            <li>Dashboard access</li>
            <li>Public docs and onboarding</li>
          </ul>
        </SectionCard>
      </div>
    </section>
  );
}