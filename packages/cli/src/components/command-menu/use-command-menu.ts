import { ScrollBoxRenderable } from "@opentui/core";
import { useMemo, useRef, useState, type RefObject } from "react";
import type { Command } from "./type";
import { getFilteredCommands } from "./filter-commands";
import { useKeyboard } from "@opentui/react";

type UseCommandMenuReturn = { // Because I am using typescript have to define attributes for new consts or 'variables' that we use
    showCommandMenu: boolean;
    commandQuery:string;
    selectedIndex: number;
    scrollRef: RefObject<ScrollBoxRenderable | null>;
    handleContentChange: (text: string) => void;
    resolveCommand: (index:number) => Command | undefined;
    setSelectedIndex: (index:number) => void;
};

export function useCommandMenu(): UseCommandMenuReturn {
    const [textValue, setTextValue] = useState(""); // Tracks what user has typed 
    const [selectedIndex, setSelectedIndex] = useState(0);// tracks what the user is hovering over
    const [showCommandMenu, setShowCommandMenu] = useState(false);// sets whether command menu component should be shown
    const scrollRef = useRef<ScrollBoxRenderable>(null);

    const commandQuery = showCommandMenu && textValue.startsWith("/") ? textValue.slice(1) :""; //tracks what the user typed after /, show command menu must be true and usser input must start with / then it would extract what comes after the / if  not just show ""

    const filteredCommands = useMemo(() => getFilteredCommands(commandQuery), [commandQuery]);// gets the user input and use our function 'getfilteredcommands' to filter 
    // handles change in user input
    const handleContentChange = (text: string) => {
        setTextValue(text);
        setSelectedIndex(0);

        // Jump back to the top of the list when the user types a new character
        const scrollbox = scrollRef.current;
        if (scrollbox) {
            scrollbox.scrollTo(0)
        }
        // only shows the command menu if the user input starts with / and the prefix does not include a blank space after /
        const prefix = text.startsWith("/") ? text.slice(1) : null; //checks if it starts with /, if so does like the above commandquery
        if (prefix !== null && !prefix.includes(" ")) {
            setShowCommandMenu(true);
        } else {
            setShowCommandMenu(false);
        }
    };
    // Resolve a command at a specific index ( returns the command, caller hanles executing)
    const resolveCommand = (index: number): Command | undefined => {
        const command = filteredCommands[index];
        if (command) {
            setShowCommandMenu(false);
        }
        return command;
    };

    // Arrow keys move selection; the list follows along when the highlight goes off-screen
    useKeyboard((key) => {
        if(!showCommandMenu) return;

        if (key.name === "escape") {
            key.preventDefault();
            setShowCommandMenu(false);
        } else if (key.name === "up") {
            key.preventDefault();
            setSelectedIndex((i: number) => {
                const newIndex = Math.max(0,i - 1)
                //this is so that when it reaches the top of the visible commands if thats not index 0, it scrolls to the next index
                const sb = scrollRef.current;
                if (sb && newIndex < sb.scrollTop) {
                    sb.scrollTo(newIndex);
                }
                return newIndex;
            });
            // Basically the same thing as above a bit more complicated but trying to create a similar effect
        } else if (key.name === "down") {
            key.preventDefault();
            setSelectedIndex((i : number) => {
                if (filteredCommands.length === 0) {
                    return 0;
                }

                const newIndex = Math.min(filteredCommands.length - 1, i +1);
                const sb = scrollRef.current;
                if (sb) {
                    const viewportHeight = sb.viewport.height;
                    const visibleEnd = sb.scrollTop + viewportHeight - 1;
                    if (newIndex > visibleEnd) {
                        sb.scrollTo(newIndex- viewportHeight + 1);
                    }
                }
                return newIndex;// prevents error with i
            });
        };
    });

    return {
        showCommandMenu,
        commandQuery,
        selectedIndex,
        scrollRef,
        handleContentChange,
        resolveCommand,
        setSelectedIndex,
    };
};

