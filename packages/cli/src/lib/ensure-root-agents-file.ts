import { constants } from "node:fs";
import { access, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const DEFAULT_AGENTS_FILE_CONTENT = `# AGENTS.md

This file was created automatically by GBAM the first time you sent a prompt in this project.

Add any project-specific guidance here for future sessions, for example:
- how to run tests or builds
- coding style or architectural conventions
- review or safety requirements
- deployment notes
`;

// Track initialization promises per project directory to support multi-project workflows
const initializationPromises = new Map<string, Promise<void>>();

export async function ensureRootAgentsFile(projectPath?: string) {
  const baseDir = projectPath ? resolve(projectPath) : process.cwd();

  if (initializationPromises.has(baseDir)) {
    return initializationPromises.get(baseDir)!;
  }

  const promise = (async () => {
    const agentsFilePath = join(baseDir, "AGENTS.md");

    try {
      await access(agentsFilePath, constants.F_OK);
      return;
    } catch {
      // File does not exist yet, so create it below.
    }

    try {
      await writeFile(agentsFilePath, DEFAULT_AGENTS_FILE_CONTENT, { flag: "wx" });
    } catch (error) {
      if ((error as NodeJS.ErrnoException | undefined)?.code === "EEXIST") {
        return;
      }

      console.error("Failed to create root AGENTS.md", {
        error,
        agentsFilePath,
      });
    }
  })();

  initializationPromises.set(baseDir, promise);
  return promise;
}