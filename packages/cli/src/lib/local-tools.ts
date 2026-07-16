import { mkdir, readFile, readdir, stat, writeFile } from "fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "path";
import { toolInputSchemas, Mode, type ModeType } from "@gbam/shared";


const MAX_FILE_SIZE = 40_000;     
const MAX_RESULTS = 400;         
const MAX_MATCHES = 100;         
const MAX_OUTPUT = 60_000;      
const DEFAULT_TIMEOUT = 45_000;  

function resolveInsideCwd(path: string) {
    const cwd = process.cwd();
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

export async function executeLocalTool(toolName: string, input: unknown, mode: ModeType) {
    if (mode === Mode.PLAN && !["readFile", "listDirectory", "glob", "grep"]. includes(toolName)) {
        throw new Error(`Tool ${toolName} is not available in PLAN mode`);
    }

    switch (toolName) {
        // ✅ UPDATED: Supports line-range pagination and appends explicit context guardrail system warnings
        case "readFile": {
            const { path, startLine, lineCount } = toolInputSchemas.readFile.parse(input);
            const { resolved } = resolveInsideCwd(path);
            const content = await readFile(resolved, "utf-8");

            // Line pagination logic
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

            // Traditional fallback reading with helpful warning
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
            const { resolved, cwd } = resolveInsideCwd(path);
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
            const { path, pattern } = toolInputSchemas.glob.parse(input);
            const { resolved, cwd } = resolveInsideCwd(path);
            const glob = new Bun.Glob(pattern);
            const files: string[] = [];
            let truncated = false;

            for await (const match of glob.scan({ cwd: resolved, dot: false, onlyFiles: true})) {
                if (match.includes("node_modules")) continue;
                if (files.length >= MAX_RESULTS) {
                    truncated = true;
                    break;
                }
                files.push(relative(cwd, resolve(resolved, match)));
            }

            files.sort();
            return { files, ...(truncated ? { truncated: true} : {})};
        }
        case "grep": {
        const { pattern, path, include } = toolInputSchemas.grep.parse(input);
        const { cwd, resolved } = resolveInsideCwd(path);
        const args = [
            "-rn",
            "--color=never",
            "--exclude-dir=node_modules",
            "--exclude-dir=.git",
            "-E",
        ];
        if (include) args.push(`--include=${include}`);
        args.push(pattern, resolved);

        const proc = Bun.spawn(["grep", ...args], { cwd, stdout: "pipe", stderr: "pipe" });
        const [stdout, stderr] = await Promise.all([
            new Response(proc.stdout).text(),
            new Response(proc.stderr).text(),
        ]);
        const exitCode = await proc.exited;

        if (exitCode !== 0 && exitCode !== 1) throw new Error(`grep failed: ${stderr.trim()}`);
        if (!stdout.trim()) return { matches: [], message: "No matches found" };

        const lines = stdout.trim().split("\n");
        const matches: { file: string; line: number; content: string }[] = [];
        let truncated = false;

        for (const line of lines) {
            if (matches.length >= MAX_MATCHES) {
            truncated = true;
            break;
            }
            const match = line.match(/^(.+?):(\d+):(.*)$/);
            if (match) {
            matches.push({
                file: relative(cwd, match[1]!),
                line: Number(match[2]),
                content: match[3]!,
            });
            }
        }

        return { matches, ...(truncated ? { truncated: true, totalMatches: lines.length } : {}) };
        }
        case "writeFile": {
        const { path, content } = toolInputSchemas.writeFile.parse(input);
        const { cwd, resolved } = resolveInsideCwd(path);
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
        const { cwd, resolved } = resolveInsideCwd(path);
        const content = await readFile(resolved, "utf-8");
        const occurrences = content.split(oldString).length - 1;

        if (occurrences === 0) throw new Error("oldString not found in file");
        if (occurrences > 1) throw new Error(`oldString is ambiguous; found ${occurrences} matches`);

        await writeFile(resolved, content.replace(oldString, newString), "utf-8");
        return { success: true as const, path: relative(cwd, resolved) };
        }
        case "bash": {
            const { command, timeout = DEFAULT_TIMEOUT } = toolInputSchemas.bash.parse(input);
            
            const proc = Bun.spawn(["bash", "-c", command], {
                cwd: resolveInsideCwd(".").resolved,
                stdout: "pipe",
                stderr: "pipe",
                env: { ...process.env, TERM: "dumb" },
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