import { LifeBuoy } from "lucide-react";
import { SectionCard } from "../_components/docs-ui";

export default function DocsTroubleshootingPage() {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3 text-primary">
        <LifeBuoy className="size-5" />
        <h2 className="font-display text-2xl font-semibold">Troubleshooting</h2>
      </div>
      <div className="grid gap-4">
        <SectionCard>
          <p className="font-display text-base font-semibold">The login tab opens but the CLI does not complete sign-in</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Make sure you finish the browser flow completely and that the local callback is
            allowed to open on your machine. Then retry
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-foreground">/login</code>.
          </p>
        </SectionCard>
        <SectionCard>
          <p className="font-display text-base font-semibold">The agent cannot find my project files</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Start GBAM from the repository you want to work in. Tool access is scoped to the
            current project path rather than to arbitrary locations on disk.
          </p>
        </SectionCard>
        <SectionCard>
          <p className="font-display text-base font-semibold">I need analysis only, not code changes</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Switch to PLAN with <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">/agents</code>
            or by pressing <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">Tab</code>.
            PLAN keeps tool access read-only.
          </p>
        </SectionCard>
        <SectionCard>
          <p className="font-display text-base font-semibold">Streaming output is too long</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Press <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">Esc</code>
            while the assistant is streaming to interrupt the current response.
          </p>
        </SectionCard>
        <SectionCard>
          <p className="font-display text-base font-semibold">GBAM keeps asking to confirm the same kind of action</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            "Always" only remembers the exact file or command you approved, not the whole tool
            category. If you'd rather stop being asked for a category of actions entirely (for
            example, all shell commands), set that category to Allow on the Permissions page in
            your dashboard.
          </p>
        </SectionCard>
        <SectionCard>
          <p className="font-display text-base font-semibold">Install fails or "no prebuilt binary" on Linux</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            GBAM does not currently publish a Linux build. macOS and Windows are supported today;
            Linux support is planned.
          </p>
        </SectionCard>
      </div>
    </section>
  );
}