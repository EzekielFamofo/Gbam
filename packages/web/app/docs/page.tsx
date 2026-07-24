import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  CreditCard,
  FolderTree,
  KeyRound,
  Layers,
  LifeBuoy,
  ShieldCheck,
  Terminal,
  Workflow,
  Wrench,
} from "lucide-react";
import { DEFAULT_CHAT_MODEL_ID, SUPPORTED_CHAT_MODELS } from "@gbam/shared";
import { Button } from "@/components/ui/button";

const sectionLinks = [
  { id: "overview", label: "Overview" },
  { id: "install", label: "Install & first run" },
  { id: "commands", label: "Commands" },
  { id: "auth", label: "Sign in & auth" },
  { id: "modes", label: "Modes" },
  { id: "sessions", label: "Sessions" },
  { id: "models", label: "Models" },
  { id: "agents", label: "AGENTS.md" },
  { id: "tools", label: "Local tools" },
  { id: "dashboard", label: "Dashboard & billing" },
  { id: "safety", label: "Safety boundaries" },
  { id: "troubleshooting", label: "Troubleshooting" },
];

const commandList = [
  { value: "/new", description: "Start a new conversation" },
  { value: "/agents", description: "Switch between Plan and Build modes" },
  { value: "/models", description: "Choose the AI model used for generation" },
  { value: "/sessions", description: "Browse and reopen previous sessions" },
  { value: "/login", description: "Sign in with your browser" },
  { value: "/logout", description: "Clear locally stored auth state" },
  { value: "/upgrade", description: "Open credits checkout in your browser" },
  { value: "/usage", description: "Open the billing portal in your browser" },
  { value: "/exit", description: "Quit the application" },
];

const planTools = ["readFile", "listDirectory", "glob", "grep", "webfetch"];
const buildOnlyTools = ["writeFile", "editFile", "bash"];

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3 font-mono text-sm text-primary">
      {children}
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-5">{children}</div>;
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-1 font-display text-lg font-semibold tracking-tight">
            GBAM
            <span className="text-primary motion-safe:animate-pulse">_</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">Dashboard</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="size-4" /> Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Workflow className="size-3.5" />
            CLI-first product docs
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
            GBAM CLI user manual
          </h1>
          <p className="text-lg leading-8 text-muted-foreground">
            GBAM is a terminal chat app for working with AI conversations and real project context.
            The CLI is the part of the system that can access your local repository, read and edit
            files, and run local commands. The server handles authentication, persistence, model
            orchestration, billing, and streamed responses.
          </p>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav className="rounded-3xl border border-border bg-card p-4">
              <p className="px-2 pb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                On this page
              </p>
              <div className="space-y-1">
                {sectionLinks.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    {section.label}
                  </a>
                ))}
              </div>
            </nav>
          </aside>

          <main className="space-y-12">
            <section id="overview" className="scroll-mt-28 space-y-5">
              <div className="flex items-center gap-3 text-primary">
                <Terminal className="size-5" />
                <h2 className="font-display text-2xl font-semibold">Overview</h2>
              </div>
              <p className="leading-7 text-muted-foreground">
                GBAM is designed around a strict responsibility split. The backend decides what the
                model should do and persists the conversation, but your local CLI is the only part
                allowed to touch your project files. That makes the terminal app the main user-facing
                product for coding work, while the website supports account, billing, and dashboard
                flows.
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
                    <li>Dashboard access</li>
                    <li>Public docs and onboarding</li>
                  </ul>
                </SectionCard>
              </div>
            </section>

            <section id="install" className="scroll-mt-28 space-y-5">
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
            </section>

            <section id="commands" className="scroll-mt-28 space-y-5">
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
                    to interrupt output.
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

            <section id="auth" className="scroll-mt-28 space-y-5">
              <div className="flex items-center gap-3 text-primary">
                <KeyRound className="size-5" />
                <h2 className="font-display text-2xl font-semibold">Sign in & auth</h2>
              </div>
              <p className="leading-7 text-muted-foreground">
                GBAM uses a browser-linked login flow instead of asking you to manage API keys in the
                terminal. When you run <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">/login</code>,
                the CLI opens your browser, the website continues the auth flow, and control is handed
                back to the terminal when sign-in completes.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <SectionCard>
                  <p className="font-display text-base font-semibold">How the flow works</p>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                    <li>The CLI starts a temporary localhost callback server.</li>
                    <li>The browser opens to the GBAM web experience.</li>
                    <li>The website and auth provider complete identity verification.</li>
                    <li>The server redirects back to the local CLI callback.</li>
                    <li>The CLI stores the returned bearer token locally.</li>
                  </ol>
                </SectionCard>
                <SectionCard>
                  <p className="font-display text-base font-semibold">Local credential storage</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Auth state is stored on your machine in
                    <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-foreground">~/.gbam/auth.json</code>
                    with owner-only permissions where supported. If the server later returns 401,
                    the CLI clears local auth and asks you to sign in again.
                  </p>
                </SectionCard>
              </div>
            </section>

            <section id="modes" className="scroll-mt-28 space-y-5">
              <div className="flex items-center gap-3 text-primary">
                <Layers className="size-5" />
                <h2 className="font-display text-2xl font-semibold">Modes</h2>
              </div>
              <p className="leading-7 text-muted-foreground">
                Mode is not just a UI label. It determines what tools the agent is allowed to use and
                whether the conversation is operating in read-only planning or full implementation mode.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <SectionCard>
                  <p className="font-display text-base font-semibold">PLAN</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Read-only analysis mode for explanation, tracing, architecture review, and change
                    proposals. PLAN can inspect files and research linked documentation, but it cannot
                    edit files or run shell commands.
                  </p>
                  <div className="mt-4">
                    <CodeBlock>$ gbam --mode PLAN "explain this codebase"</CodeBlock>
                  </div>
                </SectionCard>
                <SectionCard>
                  <p className="font-display text-base font-semibold">BUILD</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Full implementation mode for making repository changes directly. BUILD can read,
                    edit, and write files, perform controlled web fetches, and execute shell commands
                    inside your project.
                  </p>
                  <div className="mt-4">
                    <CodeBlock>$ gbam --mode BUILD "add missing API validation"</CodeBlock>
                  </div>
                </SectionCard>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 text-sm leading-6 text-muted-foreground">
                Use PLAN when you want inspection without edits. Use BUILD when you want direct
                implementation and are ready for repository changes.
              </div>
            </section>

            <section id="sessions" className="scroll-mt-28 space-y-5">
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
                    comes from your current directory name, with a fallback to “CLI session”.
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
            </section>

            <section id="models" className="scroll-mt-28 space-y-5">
              <div className="flex items-center gap-3 text-primary">
                <Bot className="size-5" />
                <h2 className="font-display text-2xl font-semibold">Models</h2>
              </div>
              <p className="leading-7 text-muted-foreground">
                The CLI lets you choose a model, but the server remains the authority on whether a
                model ID is supported. The default chat model is
                <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-foreground">{DEFAULT_CHAT_MODEL_ID}</code>.
              </p>
              <div className="rounded-3xl border border-border bg-card overflow-hidden">
                <div className="grid grid-cols-[minmax(0,1.5fr)_110px_90px_120px] border-b border-border bg-muted/40 px-5 py-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  <span>Model</span>
                  <span>Provider</span>
                  <span>Cost</span>
                  <span>Thinking</span>
                </div>
                {SUPPORTED_CHAT_MODELS.map((model, index) => (
                  <div
                    key={model.id}
                    className={`grid grid-cols-[minmax(0,1.5fr)_110px_90px_120px] px-5 py-3 text-sm ${
                      index === SUPPORTED_CHAT_MODELS.length - 1 ? "" : "border-b border-border"
                    }`}
                  >
                    <code className="font-mono text-primary">{model.id}</code>
                    <span className="text-muted-foreground">{model.provider}</span>
                    <span className="text-muted-foreground">{model.costTier}</span>
                    <span className="text-muted-foreground">{model.supportsThinking ? "Yes" : "No"}</span>
                  </div>
                ))}
              </div>
              <SectionCard>
                <p className="font-display text-base font-semibold">Model picker search</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  The model picker supports searching by model ID, provider name, cost tier
                  (<code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-foreground">$</code>,
                  <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-foreground">$$</code>,
                  <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-foreground">$$$</code>,
                  <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-foreground">$$$$</code>)
                  and thinking-related keywords like “thinking” or “think”.
                </p>
              </SectionCard>
            </section>

            <section id="agents" className="scroll-mt-28 space-y-5">
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
              <SectionCard>
                <p className="font-display text-base font-semibold">Why it matters</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  The server cannot read your local repository directly. AGENTS.md is the bridge that
                  lets repository-specific instructions influence model behavior while keeping direct
                  filesystem access inside the CLI.
                </p>
              </SectionCard>
            </section>

            <section id="tools" className="scroll-mt-28 space-y-5">
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
            </section>

            <section id="dashboard" className="scroll-mt-28 space-y-5">
              <div className="flex items-center gap-3 text-primary">
                <CreditCard className="size-5" />
                <h2 className="font-display text-2xl font-semibold">Dashboard & billing</h2>
              </div>
              <p className="leading-7 text-muted-foreground">
                The website complements the CLI by handling account-facing surfaces. Billing actions
                start from the terminal, but the actual checkout and portal experiences open in your
                browser.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <SectionCard>
                  <p className="font-display text-base font-semibold">Upgrade credits</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Run <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">/upgrade</code>
                    to open the hosted checkout flow and buy more credits.
                  </p>
                </SectionCard>
                <SectionCard>
                  <p className="font-display text-base font-semibold">Usage portal</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Run <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">/usage</code>
                    to open the billing portal in your browser.
                  </p>
                </SectionCard>
              </div>
              <SectionCard>
                <p className="font-display text-base font-semibold">Credit enforcement</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Credit checks, usage metering, and ledger updates are server responsibilities. The
                  CLI only initiates the flow and displays the results.
                </p>
              </SectionCard>
            </section>

            <section id="safety" className="scroll-mt-28 space-y-5">
              <div className="flex items-center gap-3 text-primary">
                <ShieldCheck className="size-5" />
                <h2 className="font-display text-2xl font-semibold">Safety boundaries</h2>
              </div>
              <p className="leading-7 text-muted-foreground">
                GBAM’s safety model starts with separation of responsibility: the backend decides the
                tool request, but the CLI performs the local action. PLAN mode exists for read-only
                work, while BUILD mode is explicit about the fact that it can modify files and run
                commands.
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
                  <p className="font-display text-base font-semibold">What to remember</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    If you want analysis only, choose PLAN. If you want direct edits or command
                    execution, choose BUILD and review the repository-specific guidance in AGENTS.md.
                  </p>
                </SectionCard>
              </div>
            </section>

            <section id="troubleshooting" className="scroll-mt-28 space-y-5">
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
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
