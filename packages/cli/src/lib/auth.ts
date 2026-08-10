import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os"
import { join } from "node:path"

export type AuthData = {
    token: string;
    refreshToken?: string;
    /** Unix ms timestamp. Absent for sessions saved before refresh support existed. */
    expiresAt?: number;
};

const AUTH_DIR = join(homedir(), ".gbam");
const AUTH_FILE = join(AUTH_DIR, "auth.json");

export function getAuth(): AuthData | null {
    try {
        const data = readFileSync(AUTH_FILE, "utf-8");
        const parsed = JSON.parse(data) as Partial<AuthData>;
        return typeof parsed.token === "string"
            ? {
                token: parsed.token,
                refreshToken: typeof parsed.refreshToken === "string" ? parsed.refreshToken : undefined,
                expiresAt: typeof parsed.expiresAt === "number" ? parsed.expiresAt : undefined,
            }
            : null;
    } catch {
        return null;
    }
}

export function saveAuth(data: AuthData) {
    if (!existsSync(AUTH_DIR)) {
        // Owner-only permission so other users on the machine can't read tokens
        mkdirSync(AUTH_DIR, { mode: 0o700 });
    }
    writeFileSync(AUTH_FILE, JSON.stringify(data), { mode: 0o600 });
}

export function clearAuth() {
    try {
        unlinkSync(AUTH_FILE);
    } catch {
        // File doesn't exist
    }
}