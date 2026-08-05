import { Lock } from "lucide-react";
import { SectionCard } from "../_components/docs-ui";

export default function DocsPermissionsPage() {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3 text-primary">
        <Lock className="size-5" />
        <h2 className="font-display text-2xl font-semibold">Permissions</h2>
      </div>
      <p className="leading-7 text-muted-foreground">
        Permissions is a second, independent safety layer on top of mode selection. Where PLAN
        and BUILD control which tools exist at all, Permissions control what happens each time
        BUILD actually tries to use one - per tool, not just per mode.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard>
          <p className="font-display text-base font-semibold">Allow</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The action runs immediately, with no interruption.
          </p>
        </SectionCard>
        <SectionCard>
          <p className="font-display text-base font-semibold">Ask</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            GBAM pauses and shows a confirmation prompt in the terminal before running the
            action.
          </p>
        </SectionCard>
        <SectionCard>
          <p className="font-display text-base font-semibold">Deny</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The action is blocked. The agent receives an error explaining it was not permitted
            and continues the conversation without running it.
          </p>
        </SectionCard>
      </div>
      <SectionCard>
        <p className="font-display text-base font-semibold">Responding to a prompt</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          When GBAM asks for confirmation, you have three choices: allow it once, deny it, or
          choose "Always" to allow it for the rest of the current session. "Always" is scoped to
          that exact action - approving one specific file edit or shell command does not
          automatically approve a different file or a different command; each distinct action
          is remembered separately.
        </p>
      </SectionCard>
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard>
          <p className="font-display text-base font-semibold">Protected paths</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Certain sensitive paths - such as environment files and version control internals -
            always require confirmation, regardless of your other rules. You can add your own
            custom protected paths from the dashboard for extra caution on files specific to
            your project.
          </p>
        </SectionCard>
        <SectionCard>
          <p className="font-display text-base font-semibold">Managing your rules</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Set default Allow/Ask/Deny rules per tool category, and manage protected paths,
            from the Permissions page on your dashboard. Changes take effect on your very next
            message - no need to restart the CLI.
          </p>
        </SectionCard>
      </div>
    </section>
  );
}