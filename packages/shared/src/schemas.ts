import { tool } from "ai"
import z from "zod"

export const Mode = {
    BUILD: "BUILD",
    PLAN: "PLAN",
} as const 

export const modeSchema = z.enum([Mode.BUILD, Mode.PLAN]);

export type ModeType = ( typeof Mode)[keyof typeof Mode];

export const toolInputSchemas = {
    // ✅ UPDATED: Added pagination capabilities to prevent token-limit truncation issues
    readFile: z.object({
        path: z.string().describe("Relative path to the file to read"),
        startLine: z.number().optional().describe("1-based line number to start reading from"),
        lineCount: z.number().optional().describe("Number of lines to read (default: 150)"),
    }),
    listDirectory: z.object({
        path: z.string().default(".").describe("Relative directory path to list"),
    }),
    glob: z.object({
        pattern: z.string().describe("Regex pattern to search for"),
        path: z.string().default(".").describe("Directory to search from"),
        include: z.string().optional().describe("Optional glob for files to include"),
    }),
    grep: z.object({
    pattern: z.string().describe("Regex pattern to search for"),
    path: z.string().default(".").describe("Directory to search from"),
    include: z.string().optional().describe("Optional glob for files to include"),
    }),
    writeFile: z.object({
        path: z.string().describe("Relative path to write"),
        content: z.string().describe("File contents"),
    }),
    editFile: z.object({
        path: z.string().describe("Relative path to edit"),
        oldString: z.string().describe("Exact text to replace; must be unique"),
        newString: z.string().describe("Replacement text"),
    }),
    bash: z.object({
        command: z.string().describe("Shell command to run"),
        description: z.string().optional().describe("Short description of the command"),
        timeout: z.number().optional().describe("Timeout in milliseconds"),
    }),
    // ✅ ADDED: Web fetch input schema
    webfetch: z.object({
        url: z.string().describe("The target URL to fetch web content from"),
    }),
} as const;

export const readOnlyToolContracts = {
    // ✅ UPDATED: Clarified in description that lines can be requested directly
    readFile: tool({
        description: "Read a file from the current project directory. Supports startLine and lineCount for paginating large files.",
        inputSchema: toolInputSchemas.readFile,
    }),
    listDirectory: tool({
        description: "List entries in a directory under the current project directory.",
        inputSchema: toolInputSchemas.listDirectory,
    }),
    glob: tool({
        description: "Find files under the current project directory using a glob pattern or regex path filter.",
        inputSchema: toolInputSchemas.glob,
    }),
    grep: tool({
        description:
            "Search file contents with a regular expression under the current project directory.",
            inputSchema: toolInputSchemas.grep,
    }),
    // ✅ ADDED: Web fetch tool contract available in PLAN and BUILD modes
    webfetch: tool({
        description: "Fetch web content from a URL to look up documentation or online resources.",
        inputSchema: toolInputSchemas.webfetch,
    }),
} as const;

export const buildToolContracts = {
    ...readOnlyToolContracts,
    writeFile: tool({
        description: "Create or overwrite a file under the current project directory.",
        inputSchema: toolInputSchemas.writeFile
    }),
     editFile: tool({
        description: "Replace exact text in a file under the current project directory",
        inputSchema: toolInputSchemas.editFile
    }),
    bash: tool({
        description: "Run a shell command in the current project directory using the current platform shell. On Unix this is typically bash or sh. On Windows this may be bash, PowerShell, or cmd. Check the returned shell field before using shell-specific syntax.",
        inputSchema: toolInputSchemas.bash
    })
} as const;

export type ToolContracts = typeof buildToolContracts;

export function getToolContracts(mode: ModeType) {
    return mode === Mode.PLAN
        ? readOnlyToolContracts
        : buildToolContracts;
};