import { Terminal } from "lucide-react";
import { CodeBlock, SectionCard } from "../_components/docs-ui";

export default function DocsInstallPage() {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3 text-primary">
        <Terminal className="size-5" />
        <h2 className="font-display text-2xl font-semibold">Install & first run</h2>
      </div>
      <p className="leading-7 text-muted-foreground">
        GBAM is distributed as a global CLI package. After installation, open a terminal in
        the project you want to work on and launch the app from that directory.
      </p>
      <div className="grid gap-4">
        <CodeBlock>npm install -g gbam-dev</CodeBlock>
        <CodeBlock>gbam</CodeBlock>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard>
          <p className="font-display text-base font-semibold">What happens on first use</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The home screen lets you enter a prompt, choose a mode, and start a session. New
            sessions are created by the CLI and then persisted on the server.
          </p>
        </SectionCard>
        <SectionCard>
          <p className="font-display text-base font-semibold">Working directory matters</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Run GBAM inside the repository you want the agent to inspect. The CLI uses your
            current project path to resolve files, create or read AGENTS.md, and scope local
            tool execution safely inside that workspace.
          </p>
        </SectionCard>
      </div>
      <SectionCard>
        <p className="font-display text-base font-semibold">Supported platforms</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          GBAM currently supports  macOS (Intel and Apple Silicon) and
          Windows (x64 and ARM64). Linux support is not available yet.
        </p>
      </SectionCard>
    </section>
  );
}