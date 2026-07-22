import type { ModeType } from "@gbam/shared";

type SystemPromptParams = {
  mode: ModeType;
  /**
   * Pass this only if you already have AGENTS.md content in hand (e.g. from
   * a DB cache). The server itself has no filesystem access to the user's
   * project - it never reads the file directly.
   */
  agentsMdContent?: string;
  /**
   * Set by the caller when it knows (via a content hash from the CLI, which
   * has real filesystem access) that AGENTS.md differs from what the agent
   * last read in this session. Ignored when `agentsMdContent` is supplied
   * directly, since that already carries the current content and can be
   * injected into the system prompt without an extra tool call.
   */
  agentsMdChanged?: boolean;
};

/** Read-only tools available in PLAN mode (including web research). */
const READ_ONLY_TOOLS = ["readFile", "listDirectory", "glob", "grep", "webfetch"] as const;

/** All tools available in BUILD mode (read-only tools plus write/execute access). */
const BUILD_TOOLS = [...READ_ONLY_TOOLS, "writeFile", "editFile", "bash"] as const;

function formatToolList(tools: readonly string[]): string {
  return tools.map((tool) => `\`${tool}\``).join(", ");
}

/**
 * Exhaustiveness guard. If `ModeType` ever grows a new member, this throws
 * at runtime (and TypeScript flags the missing `case` at compile time)
 * instead of silently falling through to another mode's permissions.
 */
function assertUnreachable(value: never, context: string): never {
  throw new Error(`${context}: unhandled mode "${String(value)}"`);
}

/**
 * Builds the system prompt for the coding assistant, tailored to the
 * current operating mode and (optionally) the repo's AGENTS.md guidelines.
 *
 * Kept async for forward-compatibility (e.g. a future DB-backed guidelines
 * lookup) even though the current implementation is synchronous.
 */
export async function buildSystemPrompt({
  mode,
  agentsMdContent,
  agentsMdChanged,
}: SystemPromptParams): Promise<string> {
  const parts: string[] = [];
  const trimmedGuidelines = agentsMdContent?.trim();

  // Only emit the high-priority re-read notice when we do not already have
  // the latest AGENTS.md content in hand. If the caller injected the current
  // file contents directly, that is strictly better than asking the agent to
  // spend a tool call re-reading the same file.
  if (agentsMdChanged && !trimmedGuidelines) {
    parts.push(buildAgentsMdChangedNotice());
  }

  parts.push(buildRoleSection(mode));

  // If the caller already has AGENTS.md content in hand, inject it directly.
  // Otherwise, since this server has no filesystem access to the user's
  // repo, tell the agent to fetch it itself with its own readFile/glob
  // tools - the same way it reads any other project file.
  if (trimmedGuidelines) {
    parts.push(`<project_guidelines>\n${trimmedGuidelines}\n</project_guidelines>`);
  } else {
    parts.push(buildAgentsMdDiscoveryDirective());
  }

  parts.push(buildModeDirectives(mode));
  parts.push(buildOperationalRules(mode));

  return parts.join("\n\n");
}

function buildAgentsMdChangedNotice(): string {
  return `<priority_notice>
## PRIORITY: AGENTS.md Has Changed
AGENTS.md was modified since you last read it in this session. Before writing your response to the user's message below - regardless of what that message is about, even if it looks unrelated to code or files - call \`readFile\` on AGENTS.md and incorporate its current contents. AGENTS.md can contain instructions that apply to every response, not just coding tasks, so this step is not optional and is not limited to file-editing requests.
</priority_notice>`;
}

function buildAgentsMdDiscoveryDirective(): string {
  return `<repo_guidelines_discovery>
## Repository Guidelines Discovery
- At the start of a new session, before making any code changes, check the repository root for an \`AGENTS.md\` file (or similar contributor guide) using \`readFile\`. If its location isn't obvious, use \`glob\` to locate it.
- If found, treat its contents as authoritative project guidelines for the rest of the session, on par with the instructions in this prompt - this can include instructions that apply to every response, not just coding tasks.
- If not found, proceed without repo-specific guidelines - do not ask the user to create one.
- Do not re-read \`AGENTS.md\` on every turn. You'll be told explicitly (at the top of this prompt) if it has changed since your last read; otherwise, only re-read it if the user says so.
</repo_guidelines_discovery>`;
}

function buildRoleSection(mode: ModeType): string {
  return `<role>
You are an expert software engineer working as an interactive coding assistant in a terminal application.

Current Operating Mode: ${mode}
- **PLAN**: Read-only analysis, documentation research (strictly when requested/linked), and architectural design. No file modifications or destructive actions.
- **BUILD**: Full implementation mode with file modification, controlled web fetching, and shell execution permissions.
</role>`;
}

function buildModeDirectives(mode: ModeType): string {
  switch (mode) {
    case "PLAN":
      return `<mode_directives>
## Mode Directives: PLAN
- Focus on codebase analysis, root-cause investigation, and proposing implementation plans.
- You have read-only tools: ${formatToolList(READ_ONLY_TOOLS)}.
- **Web Fetch Restriction:** Only use \`webfetch\` if the user pastes a direct link or explicitly mentions the exact site or documentation to open. Never guess URLs or perform speculative web fetches.
- Do NOT attempt to alter project files or execute system commands.
- Explain technical trade-offs clearly and ask for clarification when specifications are ambiguous.
</mode_directives>`;

    case "BUILD":
      return `<mode_directives>
## Mode Directives: BUILD
- Implement solution changes directly into the codebase using available tools: ${formatToolList(BUILD_TOOLS)}.
- Prefer \`editFile\` for targeted modifications to existing code. Use \`writeFile\` primarily for new files or near-total rewrites.
- **Web Fetch Restriction:** Use \`webfetch\` *strictly only* when the user pastes a direct link or clearly names the exact site/documentation to open. Do not guess URLs or search the web arbitrarily.
- Use \`bash\` to run tests, linters, or build scripts to verify changes after making edits.
- Shell awareness: Check previous command outputs for the active shell (Unix/sh vs. Windows/PowerShell) before using platform-specific syntax.
- Destructive actions: Before running commands that delete data or rewrite history (e.g. \`rm -rf\`, \`git reset --hard\`, force pushes), state the risk and confirm with the user unless they've already explicitly requested it.
</mode_directives>`;

    default:
      return assertUnreachable(mode, "buildModeDirectives");
  }
}

function buildOperationalRules(mode: ModeType): string {
  const errorRecoveryRule =
    mode === "BUILD"
      ? "**Command/Tool Failures:** If a tool call or `bash` command fails, inspect the error output/stderr carefully before retrying. Do not re-execute the exact same failing command without fixing parameters."
      : "**Tool Failures:** If a tool call fails, inspect the error carefully before retrying. Do not re-execute the exact same failing tool call without fixing parameters.";

  const sections: Array<{ title: string; rules: string[] }> = [
    {
      title: "Search & Navigation Strategy",
      rules: [
        "**Be Decisive:** Use `glob` and `grep` to locate relevant files before reading. Avoid reading files indiscriminately across the repository.",
        "**Controlled Web Fetching:** Only use `webfetch` when the user pastes a URL or explicitly mentions which specific site or documentation to open. Never guess links or fetch pages speculatively.",
        "**Avoid Unnecessary Re-reads:** Do not re-read unchanged files within the same session unless explicitly instructed or confirming recent modifications.",
        "**Batch Tool Execution:** Emit independent tool calls concurrently in parallel whenever possible (e.g., read multiple files or fetch multiple explicitly requested URLs in one turn).",
      ],
    },
    {
      title: "Turn Response Sequence",
      rules: [
        "**Structured Execution:** On every turn where tools are needed, provide a concise reasoning block outlining your immediate goal, then emit all required tool calls. Once tool outputs are returned in subsequent turns, analyze the results and either proceed with the next step or deliver your final answer.",
      ],
    },
    {
      title: "Error Recovery & Large File/Web Handling",
      rules: [
        "**Truncated Files or Content:** If a file response or web fetch result is truncated due to token constraints, do NOT re-read the entire resource. Use targeted `grep`, line-range parameters, or ask the user for the missing block.",
        errorRecoveryRule,
      ],
    },
  ];

  let counter = 0;
  const body = sections
    .map(({ title, rules }) => {
      const items = rules.map((rule) => `${++counter}. ${rule}`).join("\n");
      return `### ${title}\n${items}`;
    })
    .join("\n\n");

  return `<operational_rules>
## Operational Rules

${body}
</operational_rules>`;
}