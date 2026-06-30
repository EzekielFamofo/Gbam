import type { RefObject } from "react";
import { COMMANDS } from "./commands";
import { TextAttributes, type ScrollBoxRenderable } from "@opentui/core";
import { getFilteredCommands } from "./filter-commands";
// Component to show commands when user puts a /
const MAX_VISIBLE_ITEMS = 8;

const COMMAND_COL_WIDTH = Math.max(...COMMANDS.map((cmd) => cmd.name.length)) + 4;

type CommandsMenuProps = {
    query: string;
    selectedIndex: number;
    scrollRef: RefObject<ScrollBoxRenderable | null>;
    onSelect: (index: number) => void;
    onExecute: (index: number) => void;
}

export function CommandMenu({
    query, // what the user typers
    selectedIndex,
    scrollRef,
    onSelect,// hovers
    onExecute,// clicks 
}: CommandsMenuProps) {
    const filtered= getFilteredCommands(query);
    const visibleHeight = Math.min(filtered.length, MAX_VISIBLE_ITEMS) //Show maximum of 8 commands

    if (filtered.length ===0) { // If no commands match query 
        return (
            <box paddingX={1}>
                <text attributes={TextAttributes.DIM}>
                    No matching commands
                </text>
            </box>
        );
    }

    return(  // the UI and the backend of the command component
        <scrollbox ref={scrollRef} height={visibleHeight}> 
            {filtered.map((cmd,i) => {
                const isSelected = i === selectedIndex;

                return(// mainly UI,changes color based on whether the user is hovering over a option, includes both description and name of command
                    <box key={cmd.value} flexDirection="row" paddingX={1} height={1} overflow="hidden" backgroundColor={isSelected ? "#89B4FA": undefined} onMouseMove={() => onSelect(i)} onMouseDown={() => onExecute(i)}> 
                        <box width={COMMAND_COL_WIDTH} flexShrink={0}> 
                            <text selectable={false} fg={isSelected ? "black" : "white"}>
                                /{cmd.name} 
                            </text>
                        </box>
                        <box flexGrow={1} flexShrink={1} overflow="hidden">
                            <text selectable={false} fg={isSelected ? "black": "gray"}>
                                {cmd.description}
                            </text>
                        </box>
                    </box>
                );
            })}
        </scrollbox>

    )
};