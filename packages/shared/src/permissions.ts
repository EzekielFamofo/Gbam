import { z } from "zod";

export const permissionActionSchema = z.enum(["allow", "ask", "deny"]);
export const toolCategorySchema = z.enum(["read", "list", "glob", "grep", "edit", "bash", "webfetch", "*"]);

export const permissionRuleSchema = z.object({
  category: toolCategorySchema,
  pattern: z.string().min(1).max(500).optional(),
  action: permissionActionSchema,
});

export const permissionConfigSchema = z.array(permissionRuleSchema).max(100).nullable();


export type PermissionAction = "allow" | "ask" | "deny";
export type ToolCategory = "read" | "list" | "glob" | "grep" | "edit" | "bash" | "webfetch" | "*";

export type PermissionRule = {
  category: ToolCategory;
  pattern?: string; // Optional glob/wildcard (e.g., "*.ts", "npm *", "github.com")
  action: PermissionAction;
};

// Borrowed from Claude Code: Hardcoded protections that bypass user config
export const PROTECTED_PATHS = [
  "**/.env*",
  "**/.git/**",
  "~/.bashrc",
  "~/.zshrc",
  "**/.config/**"
];

// The sensible defaults you defined
export const DEFAULT_PERMISSION_RULES: PermissionRule[] = [
  { category: "read", action: "allow" },
  { category: "list", action: "allow" },
  { category: "glob", action: "allow" },
  { category: "grep", action: "allow" },
  { category: "edit", action: "ask" },
  { category: "bash", action: "ask" },
  { category: "webfetch", action: "ask" }
];

/**
 * Maps the raw GBAM tool names to our consolidated permission categories.
 */
export function getToolCategory(toolName: string): ToolCategory | null {
  switch (toolName) {
    case "readFile": return "read";
    case "listDirectory": return "list";
    case "glob": return "glob";
    case "grep": return "grep";
    case "writeFile":
    case "editFile": return "edit"; // Merged as requested
    case "bash": return "bash";
    case "webfetch": return "webfetch";
    default: return null;
  }
}

/**
 * A lightweight, zero-dependency wildcard matcher.
 * Converts simple wildcards like .env*" into regex for testing. */


function matchPattern(input: string, pattern: string): boolean {
  const normalizedInput = input.replace(/\\/g, "/");
  const normalizedPattern = pattern.replace(/\\/g, "/");
  const escapeRegex = (s: string) => s.replace(/[.+?^=!:${}()|[\]\/\\]/g, "\\$1");
  const regexString = "^" + normalizedPattern.split("*").map(escapeRegex).join(".*") + "$";
  return new RegExp(regexString, "i").test(normalizedInput);
}
/**
 * Pure function to evaluate a tool action against the ruleset.
 * Returns "allow", "ask", or "deny".
 */
export function resolvePermission(
  toolName: string,
  input: string, // The file path, bash command, or URL
  userConfig: PermissionRule[] | null
): PermissionAction {
  const category = getToolCategory(toolName);
  
  // Safety fallback: if we add a new tool and forget to map it, ask the user.
  if (!category) return "ask";

  // 1. Enforce Protected Paths (Filesystem tools only)
  if (["read", "list", "edit", "glob", "grep"].includes(category)) {
    for (const protectedPath of PROTECTED_PATHS) {
      if (matchPattern(input, protectedPath)) {
        return "ask"; // Always require explicit consent for protected files
      }
    }
  }

  // 2. Evaluate Rules (Last-Match-Wins)
  const rulesToEvaluate = userConfig && userConfig.length > 0 ? userConfig : DEFAULT_PERMISSION_RULES;
  let finalAction: PermissionAction | null = null;

  for (const rule of rulesToEvaluate) {
    // Check if the rule applies to this category (or is a global "*" rule)
    if (rule.category === "*" || rule.category === category) {
      // If there's no pattern, it's a category-wide rule. If there is, test it.
      if (!rule.pattern || matchPattern(input, rule.pattern)) {
        finalAction = rule.action; 
      }
    }
  }

  // 3. Fallback to default behavior if somehow no rules matched
  return finalAction ?? "ask";
}