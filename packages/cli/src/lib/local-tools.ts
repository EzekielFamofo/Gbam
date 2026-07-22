import { createHash } from "crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "path";
import { toolInputSchemas, Mode, type ModeType } from "@gbam/shared";
import { z } from "zod";

const MAX_FILE_SIZE = 40_000;     
const MAX_RESULTS = 400;         
const MAX_MATCHES = 100;         
const MAX_OUTPUT = 60_000;       
const DEFAULT_TIMEOUT = 45_000;  
const AGENTS_MD_FILENAME = "AGENTS.md";

function resolveInsideCwd(path: string, baseDir: string = process.cwd()) {
    const cwd = resolve(baseDir);
    const resolved = resolve(cwd, path);
    const rel = relative(cwd, resolved);

    if (rel.startsWith("..") || isAbsolute(rel)) {
        throw new Error("Path is outside the project directory")
    }

    return { cwd, resolved };
}

function truncate(value: string, limit: number) {
    return value.length > limit
        ? `${value.slice(0, limit)}\n... (truncated, ${value.length} total chars)`
        : value;
}

type AgentsMdContext = {
    hash?: string;
    content?: string;
};

export async function getAgentsMdContext(projectPath?: string): Promise<AgentsMdContext> {
    try {
        const { resolved } = resolveInsideCwd(AGENTS_MD_FILENAME, projectPath);
        const rawContent = await readFile(resolved, "utf-8");
        const normalizedForHash = rawContent.trim();
        const content = rawContent.length > MAX_FILE_SIZE
            ? `${rawContent.slice(0, MAX_FILE_SIZE)}\n\n[SYSTEM WARNING: AGENTS.md was truncated to ${MAX_FILE_SIZE} characters when sent with the chat request. If you need the rest, read AGENTS.md directly with the readFile tool.]`
            : rawContent;

        return {
            hash: createHash("sha256").update(normalizedForHash).digest("hex"),
            content,
        };
    } catch {
        return {};
    }
}

export async function getAgentsMdHash(projectPath?: string): Promise<string | undefined> {
    return (await getAgentsMdContext(projectPath)).hash;
}

export async function executeLocalTool(
    toolName: string,
    input: unknown,
    mode: ModeType,
    projectPath?: string,
) {
    // Include "webfetch" in PLAN mode since web fetching is a read-only research/documentation activity
    if (mode === Mode.PLAN && !["readFile", "listDirectory", "glob", "grep", "webfetch"].includes(toolName)) {
        throw new Error(`Tool ${toolName} is not available in PLAN mode`);
    }

    switch (toolName) {
        case "readFile": {
            const { path, startLine, lineCount } = toolInputSchemas.readFile.parse(input);
            const { resolved } = resolveInsideCwd(path, projectPath);
            const content = await readFile(resolved, "utf-8");

            if (startLine !== undefined || lineCount !== undefined) {
                const lines = content.split("\n");
                const start = Math.max(0, (startLine ?? 1) - 1);
                const count = lineCount ?? 150;
                const slicedLines = lines.slice(start, start + count);
                const slicedContent = slicedLines.join("\n");

                return {
                    content: slicedContent,
                    totalLines: lines.length,
                    rangeShown: `${start + 1} to ${Math.min(lines.length, start + count)}`,
                    warning: lines.length > (start + count)
                        ? `[SYSTEM WARNING: This is a partial reading. The file has ${lines.length} lines. To read further, request starting from line ${start + count + 1}.]`
                        : undefined
                };
            }

            return content.length > MAX_FILE_SIZE
                ? { 
                    content: content.slice(0, MAX_FILE_SIZE), 
                    truncated: true, 
                    totalLength: content.length,
                    warning: `[SYSTEM WARNING: This file is too large (${content.length} characters) and was truncated to prevent token blowup. To see specific ranges, use 'readFile' with 'startLine' and 'lineCount', or find specific blocks with 'grep'.]`
                  }
                : { content };
        }
        case "listDirectory": {
            const { path } = toolInputSchemas.listDirectory.parse(input);
            const { resolved, cwd } = resolveInsideCwd(path, projectPath);
            const entries = await readdir(resolved);
            const results: { name: string; type: "file" | "directory" }[] = [];

            for (const entry of entries) {
                if (entry.startsWith(".") || entry === "node_modules") continue;
                const info = await stat(join(resolved, entry));
                results.push({ name: entry, type: info.isDirectory() ? "directory" : "file"});
            }

            results.sort((a, b) => 
                a.type !== b.type ? (a.type === "directory" ? -1 : 1): a.name.localeCompare(b.name),
            );

            return { path: relative(cwd, resolved) || ".", entries: results }
        }
        case "glob": {
            const { path, pattern, include } = toolInputSchemas.glob.parse(input);
            const { resolved, cwd } = resolveInsideCwd(path, projectPath);
            const hasGlobSyntax = /[*?{}]/.test(pattern);
            const looksLikeRegex = !hasGlobSyntax && /[()|^$[\]\\]/.test(pattern);
            const files: string[] = [];
            let truncated = false;

            if (looksLikeRegex) {
                let regex: RegExp;
                try {
                    regex = new RegExp(pattern);
                } catch {
                    throw new Error(`Invalid regex passed to glob.pattern: ${pattern}`);
                }

                const candidateGlob = new Bun.Glob(include ?? "**/*");

                for await (const match of candidateGlob.scan({ cwd: resolved, dot: false, onlyFiles: true })) {
                    if (match.includes("node_modules")) continue;
                    if (!regex.test(match)) {
                        regex.lastIndex = 0;
                        continue;
                    }

                    if (files.length >= MAX_RESULTS) {
                        truncated = true;
                        break;
                    }

                    files.push(relative(cwd, resolve(resolved, match)));
                    regex.lastIndex = 0;
                }
            } else {
                const fileGlob = new Bun.Glob(pattern);

                for await (const match of fileGlob.scan({ cwd: resolved, dot: false, onlyFiles: true })) {
                    if (match.includes("node_modules")) continue;
                    if (files.length >= MAX_RESULTS) {
                        truncated = true;
                        break;
                    }
                    files.push(relative(cwd, resolve(resolved, match)));
                }
            }

            files.sort();
            return { files, ...(truncated ? { truncated: true } : {}) };
        }
        case "grep": {
            const { pattern, path, include } = toolInputSchemas.grep.parse(input);
            const { cwd, resolved } = resolveInsideCwd(path, projectPath);

            let regex: RegExp;
            try {
                regex = new RegExp(pattern);
            } catch {
                throw new Error(`Invalid grep regex: ${pattern}`);
            }

            const scanGlob = new Bun.Glob(include ?? "**/*");
            const matches: { file: string; line: number; content: string }[] = [];
            let truncated = false;

            for await (const relPath of scanGlob.scan({ cwd: resolved, dot: false, onlyFiles: true })) {
                if (relPath.includes("node_modules") || relPath.includes(".git")) continue;

                const absPath = resolve(resolved, relPath);

                let content: string;
                try {
                    content = await readFile(absPath, "utf-8");
                } catch {
                    continue;
                }

                if (content.includes("\0")) continue;

                const lines = content.split("\n");

                for (let index = 0; index < lines.length; index++) {
                    const line = lines[index]!;
                    if (!regex.test(line)) {
                        regex.lastIndex = 0;
                        continue;
                    }

                    matches.push({
                        file: relative(cwd, absPath),
                        line: index + 1,
                        content: line,
                    });
                    regex.lastIndex = 0;

                    if (matches.length >= MAX_MATCHES) {
                        truncated = true;
                        break;
                    }
                }

                if (truncated) break;
            }

            if (matches.length === 0) {
                return { matches: [], message: "No matches found" };
            }

            return { matches, ...(truncated ? { truncated: true } : {}) };
        }
        case "writeFile": {
            const { path, content } = toolInputSchemas.writeFile.parse(input);
            const { cwd, resolved } = resolveInsideCwd(path, projectPath);
            await mkdir(dirname(resolved), { recursive: true });
            await writeFile(resolved, content, "utf-8");
            return {
                success: true as const,
                path: relative(cwd, resolved),
                bytesWritten: Buffer.byteLength(content, "utf-8"),
            };
        }
        case "editFile": {
            const { path, oldString, newString } = toolInputSchemas.editFile.parse(input);
            const { cwd, resolved } = resolveInsideCwd(path, projectPath);
            const content = await readFile(resolved, "utf-8");
            const occurrences = content.split(oldString).length - 1;

            if (occurrences === 0) throw new Error("oldString not found in file");
            if (occurrences > 1) throw new Error(`oldString is ambiguous; found ${occurrences} matches`);

            await writeFile(resolved, content.replace(oldString, newString), "utf-8");
            return { success: true as const, path: relative(cwd, resolved) };
        }
        // ✅ ADDED: Web fetch tool execution handler
        // ✅ FIXED: Use toolInputSchemas.webfetch to parse the input safely without .url() validation constraints
case "webfetch": {
            const { url } = toolInputSchemas.webfetch.parse(input);
            try {
                const response = await fetch(url, {
                    headers: { "User-Agent": "GBAM-Coding-Assistant/1.0" },
                });

                if (!response.ok) {
                    return { error: `Failed to fetch URL: ${response.statusText}` };
                }

                const html = await response.text();
                
                // 🛠️ Strip HTML tags and clean up whitespace for LLM consumption
                const cleanContent = html
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
                    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
                    .replace(/<[^>]+>/g, " ")
                    .replace(/\s+/g, " ")
                    .trim();

                return {
                    url,
                    status: response.status,
                    content: truncate(cleanContent, MAX_OUTPUT),
                };
            } catch (error) {
                return { error: error instanceof Error ? error.message : String(error) };
            }
        }
        case "bash": {
            const { command, timeout = DEFAULT_TIMEOUT } = toolInputSchemas.bash.parse(input);
            
            const env = { ...process.env, TERM: "dumb" };
            const isWindows = process.platform === "win32";
            const shellCandidates = isWindows
                ? [
                    process.env.GBAM_SHELL,
                    Bun.which("bash"),
                    Bun.which("sh"),
                    Bun.which("pwsh"),
                    Bun.which("powershell"),
                    process.env.ComSpec,
                    Bun.which("cmd"),
                  ]
                : [
                    process.env.GBAM_SHELL,
                    process.env.SHELL,
                    Bun.which("bash"),
                    "/bin/bash",
                    Bun.which("sh"),
                    "/bin/sh",
                  ];

            const shell = shellCandidates.find((candidate): candidate is string => Boolean(candidate));

            if (!shell) {
                throw new Error(
                    "No supported shell was found. Set GBAM_SHELL to a valid shell path, or install bash, sh, PowerShell, or cmd."
                );
            }

            const shellLower = shell.toLowerCase();
            const isCmdShell = /(?:^|\\|\/)(?:cmd(?:\.exe)?)$/i.test(shellLower);
            const isPowerShell = /(?:^|\\|\/)(?:pwsh|powershell)(?:\.exe)?$/i.test(shellLower);

            const shellArgs = isCmdShell
                ? [shell, "/d", "/s", "/c", command]
                : isPowerShell
                    ? [shell, "-Command", command]
                    : [shell, "-c", command];

            const proc = Bun.spawn(shellArgs, {
                cwd: resolveInsideCwd(".", projectPath).resolved,
                stdout: "pipe",
                stderr: "pipe",
                env,
            });

            const timer = setTimeout(() => {
                try {
                    proc.kill();
                } catch {
                    // Subprocess might have already exited
                }
            }, timeout);

            let stdout = "";
            let stderr = "";

            try {
                [stdout, stderr] = await Promise.all([
                    Bun.readableStreamToText(proc.stdout),
                    Bun.readableStreamToText(proc.stderr),
                ]);
            } finally {
                clearTimeout(timer);
            }

            const exitCode = await proc.exited;

            return {
                stdout: truncate(stdout, MAX_OUTPUT),
                stderr: truncate(stderr, MAX_OUTPUT),
                exitCode,
            };
        }
        default:
            throw new Error(`Unknown tool: ${toolName}`);
    }
};