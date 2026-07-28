import { toolInputSchemas } from "@gbam/shared";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

const GBAM_DIR = join(homedir(), ".gbam");
const UNDO_DIR = join(GBAM_DIR, "undo");
const MAX_UNDO_TURNS = 20;
const MAX_UNDO_BYTES = 15 * 1024 * 1024;

type UndoFileSnapshot = {
  path: string;
  beforeContent: string | null;
  afterContent: string | null;
};

type UndoTurn = {
  id: string;
  createdAt: number;
  files: UndoFileSnapshot[];
};

type UndoStore = {
  version: 1;
  turns: UndoTurn[];
};

export type UndoCommandResult = {
  success: boolean;
  message: string;
};

export type UndoExecutionContext = {
  sessionId: string;
  turnId: string;
};

let activeUndoCommandHandler: (() => Promise<UndoCommandResult>) | null = null;

function ensureUndoDirectory() {
  if (!existsSync(GBAM_DIR)) {
    mkdirSync(GBAM_DIR, { mode: 0o700 });
  }

  if (!existsSync(UNDO_DIR)) {
    mkdirSync(UNDO_DIR, { mode: 0o700 });
  }
}

function getUndoStorePath(sessionId: string) {
  return join(UNDO_DIR, `${encodeURIComponent(sessionId)}.json`);
}

function resolveInsideProject(path: string, projectPath?: string) {
  const cwd = resolve(projectPath ?? process.cwd());
  const resolved = resolve(cwd, path);
  const rel = relative(cwd, resolved);

  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error("Path is outside the project directory");
  }

  return { resolved, relativePath: rel };
}

async function readTextIfExists(path: string) {
  try {
    return await readFile(path, "utf-8");
  } catch {
    return null;
  }
}

function loadUndoStore(sessionId: string): UndoStore {
  try {
    const raw = readFileSync(getUndoStorePath(sessionId), "utf-8");
    const parsed = JSON.parse(raw) as Partial<UndoStore>;

    if (!Array.isArray(parsed.turns)) {
      return { version: 1, turns: [] };
    }

    return {
      version: 1,
      turns: parsed.turns.flatMap((turn) => {
        if (!turn || typeof turn.id !== "string" || !Array.isArray(turn.files)) {
          return [];
        }

        return [{
          id: turn.id,
          createdAt: typeof turn.createdAt === "number" ? turn.createdAt : Date.now(),
          files: turn.files.flatMap((file) => {
            if (!file || typeof file.path !== "string") {
              return [];
            }

            const beforeContent =
              file.beforeContent === null || typeof file.beforeContent === "string"
                ? file.beforeContent
                : null;
            const afterContent =
              file.afterContent === null || typeof file.afterContent === "string"
                ? file.afterContent
                : null;

            return [{ path: file.path, beforeContent, afterContent }];
          }),
        }];
      }),
    };
  } catch {
    return { version: 1, turns: [] };
  }
}

function saveUndoStore(sessionId: string, store: UndoStore) {
  ensureUndoDirectory();
  writeFileSync(getUndoStorePath(sessionId), JSON.stringify(store), { mode: 0o600 });
}

function estimateStoreBytes(store: UndoStore) {
  return Buffer.byteLength(JSON.stringify(store), "utf-8");
}

export async function prepareUndoSnapshot(
  toolName: string,
  input: unknown,
  projectPath?: string,
): Promise<UndoFileSnapshot | null> {
  if (toolName === "writeFile") {
    const { path, content } = toolInputSchemas.writeFile.parse(input);
    const { resolved, relativePath } = resolveInsideProject(path, projectPath);
    return {
      path: relativePath,
      beforeContent: await readTextIfExists(resolved),
      afterContent: content,
    };
  }

  if (toolName === "editFile") {
    const { path, oldString, newString } = toolInputSchemas.editFile.parse(input);
    const { resolved, relativePath } = resolveInsideProject(path, projectPath);
    const beforeContent = await readTextIfExists(resolved);

    if (beforeContent === null) {
      throw new Error("oldString not found in file");
    }

    const occurrences = beforeContent.split(oldString).length - 1;
    if (occurrences === 0) {
      throw new Error("oldString not found in file");
    }
    if (occurrences > 1) {
      throw new Error(`oldString is ambiguous; found ${occurrences} matches`);
    }

    return {
      path: relativePath,
      beforeContent,
      afterContent: beforeContent.replace(oldString, newString),
    };
  }

  return null;
}

export async function recordUndoSnapshot(
  sessionId: string,
  turnId: string,
  snapshot: UndoFileSnapshot,
) {
  const store = loadUndoStore(sessionId);
  let turn = store.turns.find((entry) => entry.id === turnId);

  if (!turn) {
    turn = {
      id: turnId,
      createdAt: Date.now(),
      files: [],
    };
    store.turns.push(turn);
  }

  const existingIndex = turn.files.findIndex((file) => file.path === snapshot.path);
  if (existingIndex >= 0) {
    const existing = turn.files[existingIndex]!;
    turn.files[existingIndex] = {
      path: snapshot.path,
      beforeContent: existing.beforeContent,
      afterContent: snapshot.afterContent,
    };
  } else {
    turn.files.push(snapshot);
  }

  while (store.turns.length > MAX_UNDO_TURNS) {
    store.turns.shift();
  }

  while (store.turns.length > 1 && estimateStoreBytes(store) > MAX_UNDO_BYTES) {
    store.turns.shift();
  }

  saveUndoStore(sessionId, store);
}

export async function undoLastTurn(
  sessionId: string,
  projectPath?: string,
): Promise<UndoCommandResult> {
  const store = loadUndoStore(sessionId);
  const turn = store.turns.at(-1);

  if (!turn) {
    return {
      success: false,
      message: "Nothing to undo for this session.",
    };
  }

  for (const file of [...turn.files].reverse()) {
    const { resolved } = resolveInsideProject(file.path, projectPath);
    const currentContent = await readTextIfExists(resolved);

    if (currentContent !== file.afterContent) {
      return {
        success: false,
        message: `Cannot undo because ${file.path} changed since the last recorded edit.`,
      };
    }

    if (file.beforeContent === null) {
      try {
        await unlink(resolved);
      } catch {
        // File is already gone.
      }
      continue;
    }

    await mkdir(dirname(resolved), { recursive: true });
    await writeFile(resolved, file.beforeContent, "utf-8");
  }

  store.turns.pop();
  saveUndoStore(sessionId, store);

  return {
    success: true,
    message:
      turn.files.length === 1
        ? `Undid changes to ${turn.files[0]!.path}.`
        : `Undid changes to ${turn.files.length} files.`,
  };
}

export function registerUndoCommandHandler(handler: (() => Promise<UndoCommandResult>) | null) {
  activeUndoCommandHandler = handler;

  return () => {
    if (activeUndoCommandHandler === handler) {
      activeUndoCommandHandler = null;
    }
  };
}

export async function runUndoCommand(): Promise<UndoCommandResult> {
  if (!activeUndoCommandHandler) {
    return {
      success: false,
      message: "Undo is only available in an open session.",
    };
  }

  return activeUndoCommandHandler();
}
