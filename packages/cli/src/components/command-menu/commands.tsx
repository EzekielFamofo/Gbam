import type {Command} from "./type"
// defines the commands shown and their action, name and description are used in index.tsx


export const COMMANDS: Command[] = [
    {
        name: "new",
        description: "Start a new conversation",
        value: "/new",
        action: (ctx) => {
            ctx.toast.show({message: "Starting new conversation...", variant: "success"})
        },
    },
    {
        name: "agents",
        description: "Switch agents",
        value: "/agents",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Select Mode",
                children: <text>Agent selection coming soon....</text>
            });
        },
    },
    {
        name: "models",
        description: "Select AI model for generation",
        value: "/models",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Select Model",
                children: <text>Model selection coming soon....</text>
            });
        },
    },
    {
        name: "sessions",
        description: "Browse past sessions",
        value: "/sessions",
        action: (ctx) => {
            ctx.toast.show({message: "Loading sessions...", variant: "success"})
        },
    },
    {
        name: "login",
        description: "Sign in with your browser",
        value: "/login",
        action: (ctx) => {
            ctx.toast.show({message: "Opening browser to sign in..."})
        },
    },
        {
        name: "logout",
        description: "Sign out with your browser",
        value: "/logout",
        action: (ctx) => {
            ctx.toast.show({message: "Signed out..."})
        },
    },
    {
        name: "upgrade",
        description: "Buy more credits",
        value: "/upgrade",
        action: (ctx) => {
            ctx.toast.show({message: "Opening credits checkout..."})
        },
    },
    {
        name: "usage",
        description: "Open billing portal in your browser",
        value: "/usage",
        action: (ctx) => {
            ctx.toast.show({message: "Opening billing portal..."})
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