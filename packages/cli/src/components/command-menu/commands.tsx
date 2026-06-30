import type {Command} from "./type"
// defines the commands shown and their action, name and description are used in index.tsx


export const COMMANDS: Command[] = [
    {
        name: "new",
        description: "Start a new conversation",
        value: "/new",
    },
    {
        name: "agents",
        description: "Start a new conversation",
        value: "/agents",
    },
    {
        name: "models",
        description: "Start a new conversation",
        value: "/models",
    },
    {
        name: "sessions",
        description: "Start a new conversation",
        value: "/sessions",
    },
    {
        name: "theme",
        description: "Start a new conversation",
        value: "/theme",
    },
    {
        name: "login",
        description: "Start a new conversation",
        value: "/login",
    },
        {
        name: "logout",
        description: "Start a new conversation",
        value: "/logout",
    },
    {
        name: "upgrade",
        description: "Start a new conversation",
        value: "/upgrade",
    },
    {
        name: "usage",
        description: "Start a new conversation",
        value: "/usage",
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