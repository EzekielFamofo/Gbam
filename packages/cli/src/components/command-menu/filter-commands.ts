import { COMMANDS } from "./commands";
import type { Command } from "./type";
// Simply a function to filter the commands, puts both user input(query) and commands to lowercase to avoid any errors
export function getFilteredCommands(query: string): Command[] {
    if (query.length === 0) return COMMANDS;
    return COMMANDS.filter((cmd) => cmd.name.toLowerCase().startsWith(query.toLowerCase()));
}