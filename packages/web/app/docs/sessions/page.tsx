import { FolderTree } from "lucide-react";
import { SectionCard } from "../_components/docs-ui";

export default function DocsSessionsPage() {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3 text-primary">
        <FolderTree className="size-5" />
        <h2 className="font-display text-2xl font-semibold">Sessions</h2>
      </div>
      <p className="leading-7 text-muted-foreground">
        Sessions are created in the CLI, persisted by the server, and later reopened from the
        terminal or dashboard surfaces. A session stores the conversation plus the last mode
        and model used so you can resume work with context intact.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard>
          <p className="font-display text-base font-semibold">Create</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Starting a new prompt creates a session on the server. The initial title usually
            comes from your current directory name, with a fallback to "CLI session".
          </p>
        </SectionCard>
        <SectionCard>
          <p className="font-display text-base font-semibold">Reopen</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Use <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">/sessions</code>
            to browse history, search by title, and reopen an existing thread.
          </p>
        </SectionCard>
        <SectionCard>
          <p className="font-display text-base font-semibold">Rename</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Session titles can be updated from the session view. Rename is persisted to the
            backend so the updated title appears the next time you browse history.
          </p>
        </SectionCard>
      </div>
      <SectionCard>
        <p className="font-display text-base font-semibold">Session status</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Each session shows a status on the dashboard: <strong>New</strong> before its first
          response, <strong>Waiting</strong> while a response is generating,{" "}
          <strong>Complete</strong> once a response finishes normally, or{" "}
          <strong>Interrupted</strong> if you pressed Esc before it finished.
        </p>
      </SectionCard>
    </section>
  );
}