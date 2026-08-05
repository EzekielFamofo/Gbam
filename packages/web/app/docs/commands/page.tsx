import { Bot } from "lucide-react";
import { SectionCard } from "../_components/docs-ui";

const commandList = [
  { value: "/new", description: "Start a new conversation" },
  { value: "/agents", description: "Switch between Plan and Build modes" },
  { value: "/undo", description: "Undo the last file changes from the current session" },
  { value: "/models", description: "Choose the AI model used for generation" },
  { value: "/sessions", description: "Browse and reopen previous sessions" },
  { value: "/login", description: "Sign in with your browser" },
  { value: "/logout", description: "Sign out and clear locally stored auth state" },
  { value: "/upgrade", description: "Open the pricing page in your browser to buy more credits" },
  { value: "/usage", description: "Open your usage dashboard in your browser" },
  { value: "/exit", description: "Quit the application" },
];

export default function DocsCommandsPage() {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3 text-primary">
        <Bot className="size-5" />
        <h2 className="font-display text-2xl font-semibold">Commands and keyboard flow</h2>
      </div>
      <p className="leading-7 text-muted-foreground">
        The command menu is driven by slash commands typed into the input bar. Type
        <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-foreground">/</code>
        to open the command list and execute a built-in workflow.
      </p>
      <div className="rounded-3xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[140px_minmax(0,1fr)] border-b border-border bg-muted/40 px-5 py-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <span>Command</span>
          <span>Action</span>
        </div>
        {commandList.map((command, index) => (
          <div
            key={command.value}
            className={`grid grid-cols-[140px_minmax(0,1fr)] px-5 py-3 text-sm ${
              index === commandList.length - 1 ? "" : "border-b border-border"
            }`}
          >
            <code className="font-mono text-primary">{command.value}</code>
            <span className="text-muted-foreground">{command.description}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard>
          <p className="font-display text-base font-semibold">Quick mode switch</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Press <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">Tab</code>
            to toggle between agent modes while you are in the main input layer.
          </p>
        </SectionCard>
        <SectionCard>
          <p className="font-display text-base font-semibold">Interrupt streaming</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            While an assistant response is streaming, press
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-foreground">Esc</code>
            to interrupt output. You may still be charged for credits already consumed
            generating the partial response - see Dashboard & billing.
          </p>
        </SectionCard>
        <SectionCard>
          <p className="font-display text-base font-semibold">Rename shortcut</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            In a session view, use
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-foreground">Ctrl+R</code>
            to open session rename flow.
          </p>
        </SectionCard>
      </div>
    </section>
  );
}