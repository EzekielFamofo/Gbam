// permissions-gate.ts
import { resolvePermission, getToolCategory, type UserPermissionConfig, type ModeType } from "@gbam/shared";
import { executeLocalTool } from "./local-tools";
import type { UndoExecutionContext } from "./undo-stack";

function extractTarget(toolName: string, input: any): string {
  if (!input) return "";
  if (typeof input === "string") return input;
  if (toolName === "bash") return input.command || "";
  if (toolName === "webfetch") return input.url || "";
  return input.path || "";
}

export function createPermissionGate() {
  const sessionAllowedOverrides = new Set<string>();
  return async function executeToolWithPermission(
    toolName: string,
    input: unknown,
    mode: ModeType,
    resolvedProjectPath: string,
    undoContext: UndoExecutionContext,
    permissionConfig: UserPermissionConfig | null, 
    requestConfirmation: (tool: string, target: string) => Promise<"yes" | "no" | "always">
  ) {

    const target = extractTarget(toolName, input);
    const category = getToolCategory(toolName);
    const actionKey = category ? `${category}:${target}` : `unknown:${toolName}`;

    if (sessionAllowedOverrides.has(actionKey)) {
      return executeLocalTool(toolName, input, mode, resolvedProjectPath, undoContext);
    }

    const action = resolvePermission(toolName, target, permissionConfig);

    if (action === "deny") {
      return { error: `Permission denied: GBAM is strictly forbidden from using ${toolName} on ${target}.` };
    }

    if (action === "ask") {
      const answer = await requestConfirmation(toolName, target);
      if (answer === "no") {
        return { error: `User denied permission to execute ${toolName} on ${target}.` };
      }
      if (answer === "always") {
        sessionAllowedOverrides.add(actionKey);
      }
    }

    return executeLocalTool(toolName, input, mode, resolvedProjectPath, undoContext);
  };
}