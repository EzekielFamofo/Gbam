import { ShieldCheck } from "lucide-react";
import { SectionCard } from "../_components/docs-ui";

export default function DocsSafetyPage() {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3 text-primary">
        <ShieldCheck className="size-5" />
        <h2 className="font-display text-2xl font-semibold">Safety boundaries</h2>
      </div>
      <p className="leading-7 text-muted-foreground">
        GBAM's safety model starts with separation of responsibility: the backend decides the
        tool request, but the CLI performs the local action. Mode and Permissions then work
        together as two independent layers on top of that split.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard>
          <p className="font-display text-base font-semibold">Why this is safer</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
            <li>The server does not have direct filesystem access to your codebase.</li>
            <li>Local file and shell actions stay in the terminal process.</li>
            <li>PLAN provides a read-only operating mode for inspection work.</li>
            <li>Tool path resolution is scoped to the active project.</li>
          </ul>
        </SectionCard>
        <SectionCard>
          <p className="font-display text-base font-semibold">Per-action permissions</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Beyond mode, every individual tool call is checked against your Permissions rules
            and can be set to run automatically, ask for confirmation, or be denied outright -
            with certain sensitive paths always protected regardless of your other settings.
          </p>
        </SectionCard>
      </div>
      <SectionCard>
        <p className="font-display text-base font-semibold">What to remember</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          If you want analysis only, choose PLAN. If you want direct edits or command
          execution, choose BUILD, review the repository-specific guidance in AGENTS.md, and
          configure Permissions to match how much you want to confirm yourself versus let run
          automatically.
        </p>
      </SectionCard>
    </section>
  );
}