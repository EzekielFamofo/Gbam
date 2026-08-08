import { SUPPORTED_CHAT_MODELS } from "@gbam/shared";
import { SessionsDialogContent, AgentsDialogContent, ModelsDialogContent } from "../dialogs";
import type {Command} from "./type"
import { performLogin } from "src/lib/oauth";
import { clearAuth } from "src/lib/auth";
import { runUndoCommand } from "src/lib/undo-stack";
import open from "open";
// defines the commands shown and their action, name and description are used in index.tsx
// Portions of this file are derived from opencode (c) 2025 opencode under the MIT License.

const WEB_URL = process.env.WEB_URL || "https://gbam.dev";

export const COMMANDS: Command[] = [
    {
        name: "new",
        description: "Start a new conversation",
        value: "/new",
        action: (ctx) => {
            const isNewSessionOpen = ctx.currentPath === "/" || ctx.currentPath === "/sessions/new";

            if (isNewSessionOpen) {
                return;
            }

            ctx.toast.show({message: "Starting new conversation...", variant: "success"})
            ctx.navigate("/", { state: { dismissToastOnOpen: true } })
        },
    },
    {
        name: "agents",
        description: "Switch agents",
        value: "/agents",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Select Agent",
                children: <AgentsDialogContent currentMode={ctx.mode} onSelectMode={ctx.setMode} />
            })
        },
    },
    {
        name: "models",
        description: "Select AI model for generation",
        value: "/models",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Select Model",
                children: <ModelsDialogContent models={SUPPORTED_CHAT_MODELS.map((model) => model.id)} onSelectModel={ctx.setModel} />
            })
        },
    },
    {
        name: "sessions",
        description: "Browse past sessions",
        value: "/sessions",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Sessions",
                children: <SessionsDialogContent />
            })
        },
    },
    {
        name: "undo",
        description: "Undo the last file changes from the current session",
        value: "/undo",
        action: async (ctx) => {
            const result = await runUndoCommand();
            ctx.toast.show({
                variant: result.success ? "success" : "error",
                message: result.message,
            });
        },
    },
    {
        name: "login",
        description: "Sign in with your browser",
        value: "/login",
        action: async (ctx) => {
            ctx.toast.show({message: "Opening browser to sign in..."});

            try {
                await performLogin();
                ctx.toast.show({ variant: "success", message: "Signed in " });
            } catch (error) {
                const message = error instanceof Error
                    ? error.message
                    : "Sign in failed or timed out";

                ctx.toast.show({ variant: "error", message });
            }
        },
    },
        {
        name: "logout",
        description: "Sign out",
        value: "/logout",
        action: (ctx) => {
            clearAuth();
            ctx.toast.show({message: "Signed out..."})
        },
    },
    {
        name: "upgrade",
        description: "Buy more credits",
        value: "/upgrade",
        action: async (ctx) => {
            ctx.toast.show({message: "Opening pricing page in browser..."});

            try {
                await open(new URL("/pricing", WEB_URL).toString());
                ctx.toast.show({
                    variant: "success",
                    message: "Pricing page opened in browser",
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to open pricing page";
                ctx.toast.show({ variant: "error", message});
            }
        },
    },
    {
        name: "usage",
        description: "Open usage dashboard in your browser",
        value: "/usage",
        action: async (ctx) => {
            ctx.toast.show({message: "Opening usage dashboard..."});

            try {
                await open(new URL("/dashboard/usage", WEB_URL).toString());
                ctx.toast.show({
                    variant: "success",
                    message: "Usage dashboard opened in browser",
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to open usage dashboard";
                ctx.toast.show({ variant: "error", message});
            }
        },
    },
    {
        name: "exit",
        description: "Quit the application",
        value: "/exit",
        action: (ctx) => {
            ctx.exit();
        },
    },
];