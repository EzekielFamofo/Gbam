import type { ModeType } from "@gbam/shared";

type SystemPromptParams = {
  mode: ModeType;
  agentsMdContent?: string;
};

/** Read-only tools available in PLAN mode. */
const READ_ONLY_TOOLS = ["readFile", "listDirectory", "glob", "grep"] as const;

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
 */
export function buildSystemPrompt({
  mode,
  agentsMdContent,
}: SystemPromptParams): string {
  const parts: string[] = [buildRoleSection(mode)];

  const trimmedGuidelines = agentsMdContent?.trim();
  if (trimmedGuidelines) {
    parts.push(
`<project_guidelines>
${trimmedGuidelines}
</project_guidelines>`
    );
  }

  parts.push(buildModeDirectives(mode));
  parts.push(buildOperationalRules(mode));

  return parts.join("\n\n");
}

function buildRoleSection(mode: ModeType): string {
  return `<role>
You are an expert software engineer working as an interactive coding assistant in a terminal application.

Current Operating Mode: ${mode}
- **PLAN**: Read-only analysis and architectural design. No file modifications or destructive actions.
- **BUILD**: Full implementation mode with file modification and shell execution permissions.
</role>`;
}

function buildModeDirectives(mode: ModeType): string {
  switch (mode) {
    case "PLAN":
      return `<mode_directives>
## Mode Directives: PLAN
- Focus on codebase analysis, root-cause investigation, and proposing implementation plans.
- You have read-only tools: ${formatToolList(READ_ONLY_TOOLS)}.
- Do NOT attempt to alter project files or execute system commands.
- Explain technical trade-offs clearly and ask for clarification when specifications are ambiguous.
</mode_directives>`;

    case "BUILD":
      return `<mode_directives>
## Mode Directives: BUILD
- Implement solution changes directly into the codebase using available tools: ${formatToolList(BUILD_TOOLS)}.
- Prefer \`editFile\` for targeted modifications to existing code. Use \`writeFile\` primarily for new files or near-total rewrites.
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
        "**Avoid Unnecessary Re-reads:** Do not re-read unchanged files within the same session unless explicitly instructed or confirming recent modifications.",
        "**Batch Tool Execution:** Emit independent tool calls concurrently in parallel whenever possible (e.g., read multiple files in one turn).",
      ],
    },
    {
      title: "Turn Response Sequence",
      rules: [
        "**Structured Execution:** On every turn where tools are needed, provide a concise reasoning block outlining your immediate goal, then emit all required tool calls. Once tool outputs are returned in subsequent turns, analyze the results and either proceed with the next step or deliver your final answer.",
      ],
    },
    {
      title: "Error Recovery & Large File Handling",
      rules: [
        "**Truncated Files:** If a file response is truncated due to token constraints, do NOT re-read the entire file. Use targeted `grep` or line-range parameters (`startLine` / `lineCount`), or ask the user for the missing block.",
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