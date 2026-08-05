import { Workflow } from "lucide-react";
import { SectionCard } from "../_components/docs-ui";

export default function DocsAgentsMdPage() {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3 text-primary">
        <Workflow className="size-5" />
        <h2 className="font-display text-2xl font-semibold">AGENTS.md</h2>
      </div>
      <p className="leading-7 text-muted-foreground">
        AGENTS.md is the repository-specific guidance file GBAM uses to give the agent local
        instructions such as coding conventions, test steps, review rules, or deployment notes.
        It is discovered locally by the CLI and then forwarded to the server as part of each
        chat request.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard>
          <p className="font-display text-base font-semibold">Automatic bootstrap</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Before sending your first prompt in a project, the CLI ensures there is an
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-foreground">AGENTS.md</code>
            file at the project root. If one does not exist, GBAM creates a starter file for you.
          </p>
        </SectionCard>
        <SectionCard>
          <p className="font-display text-base font-semibold">What gets sent</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
            <li><code>agentsMdHash</code> for change detection</li>
            <li><code>agentsMdContent</code> so the server can inject current guidance</li>
            <li><code>projectPath</code> so tool execution is scoped correctly</li>
          </ul>
        </SectionCard>
      </div>
    </section>
  );
}