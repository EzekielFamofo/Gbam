import { z } from "zod";

export const permissionActionSchema = z.enum(["allow", "ask", "deny"]);
export const toolCategorySchema = z.enum(["read", "list", "glob", "grep", "edit", "bash", "webfetch", "*"]);

export const permissionRuleSchema = z.object({
  category: toolCategorySchema,
  pattern: z.string().min(1).max(500).optional(),
  action: permissionActionSchema,
});

export const userProtectedPathSchema = z.string().min(1).max(300);

// What actually gets persisted in UserSettings.permissionConfig now
export const userPermissionConfigSchema = z.object({
  rules: z.array(permissionRuleSchema).max(100),
  protectedPaths: z.array(userProtectedPathSchema).max(50),
});

export type PermissionAction = "allow" | "ask" | "deny";
export type ToolCategory = "read" | "list" | "glob" | "grep" | "edit" | "bash" | "webfetch" | "*";

export type PermissionRule = {
  category: ToolCategory;
  pattern?: string; // Optional glob/wildcard (e.g., "*.ts", "npm *", "github.com")
  action: PermissionAction;
};

export type UserPermissionConfig = {
  rules: PermissionRule[];
  protectedPaths: string[]; // user-added, in addition to the hardcoded list below
};

// Borrowed from Claude Code: Hardcoded protections that bypass user config.
// These are NEVER removable from the web UI — only additive user paths go through storage.
export const PROTECTED_PATHS = [
  "**/.env*",
  "**/.git/**",
  "~/.bashrc",
  "~/.zshrc",
  "**/.config/**",
];

export const DEFAULT_PERMISSION_RULES: PermissionRule[] = [
  { category: "read", action: "allow" },
  { category: "list", action: "allow" },
  { category: "glob", action: "allow" },
  { category: "grep", action: "allow" },
  { category: "edit", action: "ask" },
  { category: "bash", action: "ask" },
  { category: "webfetch", action: "ask" },
];

/**
 * Accepts whatever is actually sitting in the JSON column — could be `null`,
 * the legacy bare `PermissionRule[]` shape, or the current `{ rules, protectedPaths }`
 * shape — and always returns the current shape (or null if unset).
 */
export function normalizeStoredPermissionConfig(stored: unknown): UserPermissionConfig | null {
  if (stored == null) return null;

  if (Array.isArray(stored)) {
    // Legacy shape written before protected paths existed: a bare rules array.
    return { rules: stored as PermissionRule[], protectedPaths: [] };
  }

  const obj = stored as Partial<UserPermissionConfig>;
  return {
    rules: Array.isArray(obj.rules) ? obj.rules : [],
    protectedPaths: Array.isArray(obj.protectedPaths) ? obj.protectedPaths : [],
  };
}

export function getToolCategory(toolName: string): ToolCategory | null {
  switch (toolName) {
    case "readFile": return "read";
    case "listDirectory": return "list";
    case "glob": return "glob";
    case "grep": return "grep";
    case "writeFile":
    case "editFile": return "edit";
    case "bash": return "bash";
    case "webfetch": return "webfetch";
    default: return null;
  }
}

function matchPattern(input: string, pattern: string): boolean {
  const normalizedInput = input.replace(/\\/g, "/");
  const normalizedPattern = pattern.replace(/\\/g, "/");
  const escapeRegex = (s: string) => s.replace(/[.+?^=!:${}()|[\]\/\\]/g, "\\$1");
  const regexString = "^" + normalizedPattern.split("*").map(escapeRegex).join(".*") + "$";
  return new RegExp(regexString, "i").test(normalizedInput);
}

export function resolvePermission(
  toolName: string,
  input: string,
  userConfig: UserPermissionConfig | null,
): PermissionAction {
  const category = getToolCategory(toolName);
  if (!category) return "ask";

  if (["read", "list", "edit", "glob", "grep"].includes(category)) {
    const allProtectedPaths = [...PROTECTED_PATHS, ...(userConfig?.protectedPaths ?? [])];
    for (const protectedPath of allProtectedPaths) {
      if (matchPattern(input, protectedPath)) {
        return "ask"; // Always require explicit consent for protected files
      }
    }
  }

  const rulesToEvaluate = userConfig?.rules?.length ? userConfig.rules : DEFAULT_PERMISSION_RULES;
  let finalAction: PermissionAction | null = null;

  for (const rule of rulesToEvaluate) {
    if (rule.category === "*" || rule.category === category) {
      if (!rule.pattern || matchPattern(input, rule.pattern)) {
        finalAction = rule.action;
      }
    }
  }

  return finalAction ?? "ask";
}