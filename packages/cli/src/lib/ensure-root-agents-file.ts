import { constants } from "node:fs";
import { access, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DEFAULT_AGENTS_FILE_CONTENT = `# AGENTS.md

This file was created automatically by GBAM the first time you sent a prompt in this project.

Add any project-specific guidance here for future sessions, for example:
- how to run tests or builds
- coding style or architectural conventions
- review or safety requirements
- deployment notes
`;

let ensureRootAgentsFilePromise: Promise<void> | null = null;

export async function ensureRootAgentsFile() {
  if (ensureRootAgentsFilePromise) {
    return ensureRootAgentsFilePromise;
  }

  ensureRootAgentsFilePromise = (async () => {
    const agentsFilePath = join(process.cwd(), "AGENTS.md");

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

  return ensureRootAgentsFilePromise;
}
