import { Wrench } from "lucide-react";
import { SectionCard } from "../_components/docs-ui";

const planTools = ["readFile", "listDirectory", "glob", "grep", "webfetch"];
const buildOnlyTools = ["writeFile", "editFile", "bash"];

export default function DocsToolsPage() {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3 text-primary">
        <Wrench className="size-5" />
        <h2 className="font-display text-2xl font-semibold">Local tools</h2>
      </div>
      <p className="leading-7 text-muted-foreground">
        Tool side effects run locally inside your project. Even though the server advertises
        and validates the tool contracts, the CLI performs the actual file reads, edits, web
        fetches, and shell execution.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard>
          <p className="font-display text-base font-semibold">PLAN tools</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {planTools.map((tool) => (
              <span key={tool} className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
                {tool}
              </span>
            ))}
          </div>
        </SectionCard>
        <SectionCard>
          <p className="font-display text-base font-semibold">BUILD adds</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {buildOnlyTools.map((tool) => (
              <span key={tool} className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
                {tool}
              </span>
            ))}
          </div>
        </SectionCard>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SectionCard>
          <p className="font-display text-base font-semibold">Path safety</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Tool paths are resolved relative to the active project and blocked if they point
            outside that directory.
          </p>
        </SectionCard>
        <SectionCard>
          <p className="font-display text-base font-semibold">Large output handling</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Large file reads and web outputs are truncated with warnings so the conversation
            stays manageable while still exposing enough content for follow-up reads.
          </p>
        </SectionCard>
        <SectionCard>
          <p className="font-display text-base font-semibold">Shell execution</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">bash</code>
            tool runs locally with a default timeout of 45 seconds and uses an available shell
            such as bash, sh, PowerShell, or cmd depending on your machine.
          </p>
        </SectionCard>
      </div>
      <SectionCard>
        <p className="font-display text-base font-semibold">Permission checks run first</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Before any tool listed above actually runs, GBAM checks it against your Permissions
          settings. Depending on your configuration, an action may run immediately, ask you to
          confirm, or be blocked outright. See Permissions for details.
        </p>
      </SectionCard>
    </section>
  );
}