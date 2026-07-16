import  type { ScrollBoxRenderable, TextareaRenderable, KeyBinding } from "@opentui/core";
import { StatusBar } from "./status-bar";
import { CommandMenu } from "./command-menu";
import { useCallback, useEffect, useRef, useState, type RefObject} from "react";
import { useKeyboard, useRenderer } from "@opentui/react";
import { useCommandMenu } from "./command-menu/use-command-menu";
import type {Command} from "./command-menu/type";
import { useToast } from "../providers/toast";
import { useKeyboardLayer } from "../providers/keyboard-layer";
import { useDialog } from "../providers/dialog";
import { useNavigate } from "react-router";
import { usePromptConfig } from "src/providers/prompt-config";
import { Mode } from "@gbam/shared";
import {isAbsolute, relative, resolve } from "node:path";
import { readdir } from "node:fs/promises";
import { TextAttributes  } from "@opentui/core";

const MAX_VISIBLE_MENTIONS= 8;
const CURRENT_DIRECTORY = process.cwd();
const MAX_FALLBACK_MENTION_CANDIDATES = 32;
const MENTION_QUERY_CHARACTER = /[A-Za-z0-9._/-]/;
const RECURSIVE_MENTION_IGNORED_DIRECTORIES = new Set(["node_modules"])

type MentionMatch = {
    start: number;
    end: number;
    query: string;
};

type MentionCandidate = {
    path: string;
    kind: "file" | "directory";
};

function isWithinCurrentDirectory(targetPath: string) {
    const relativePath = relative(CURRENT_DIRECTORY, targetPath);
    return relativePath === "" || (!relativePath.startsWith("..") && !isAbsolute(relativePath));
}

function isMentionQueryCharacter(character: string) {
    return MENTION_QUERY_CHARACTER.test(character);
}

function findActiveMention(text: string, cursorOffset: number): MentionMatch | null {
    const safeOffset = Math.max(0, Math.min(cursorOffset, text.length));

    let start = safeOffset;
    while (start > 0 && !/\s/.test(text[start - 1]!)) {
        start -= 1;
    }
    let end = safeOffset;
    while (end < text.length && !/\s/.test(text[end]!)) {
        end += 1;
    }

    const token = text.slice(start, end);
    const relativeCursor = safeOffset - start;
    const mentionStart = token.lastIndexOf("@", relativeCursor);

    if (mentionStart === -1) {
        return null;
    }

    const previousCharacter = token[mentionStart - 1];
    if (previousCharacter && isMentionQueryCharacter(previousCharacter)) {
        return null;
    }

    let mentionEnd = mentionStart + 1;
    while (mentionEnd < token.length && isMentionQueryCharacter(token[mentionEnd]!)) {
        mentionEnd += 1;
    }
    
    if (relativeCursor < mentionStart || relativeCursor > mentionEnd) {
        return null;
    }

    return {
        start: start + mentionStart,
        end: start + mentionEnd,
        query: token.slice(mentionStart + 1, mentionEnd)
    };
}


async function getMentionCandidates(query: string): Promise<MentionCandidate[]> {
    const normalizedQuery = query.startsWith("./") ? query.slice(2) : query;
    if (normalizedQuery.startsWith("./")) {
        return [];
    }

    const hasTrailingSlash = normalizedQuery.endsWith("./");
    const lastSlashIndex = hasTrailingSlash
        ? normalizedQuery.length - 1
        : normalizedQuery.lastIndexOf("/")

    const directoryPart = hasTrailingSlash
        ? normalizedQuery.slice(0, -1)
        : lastSlashIndex === -1
            ? ""
            : normalizedQuery.slice(0, lastSlashIndex);

    const namePrefix = hasTrailingSlash
        ? ""
        : lastSlashIndex === -1
            ? normalizedQuery
            : normalizedQuery.slice(lastSlashIndex + 1);

    const absoluteDirectory = resolve(CURRENT_DIRECTORY, directoryPart || ".");
    if (!isWithinCurrentDirectory(absoluteDirectory)) {
        return [];
    }

    try{
        const entries = await readdir(absoluteDirectory, { withFileTypes: true });
        const lowercasePrefix = namePrefix.toLowerCase();
        const showHiddenEntries = namePrefix.startsWith(".");

        const directMatches = entries 
            .filter((entry) => showHiddenEntries || !entry.name.startsWith("."))
            .filter((entry) => {
                return lowercasePrefix === "" || entry.name.toLowerCase().startsWith(lowercasePrefix);
            })

            .sort ((left, right) => {
                if (left.isDirectory() !== right.isDirectory()) {
                    return left.isDirectory() ? -1 : 1;
                }
                return left.name.localeCompare(right.name);
            })
            .map((entry) => {
                const path = directoryPart ? `${directoryPart}/${entry.name}` : entry.name;
                const kind: MentionCandidate["kind"] = entry.isDirectory() ? "directory" : "file";
                return {
                    path: kind === "directory" ? `${path}/` : path,
                    kind,
                };
            });

            if (directMatches.length > 0 || directoryPart !== "" || namePrefix === "") {
                return directMatches;
            }

            const fallbackMatches: MentionCandidate[] = [];
            const visit = async (
                absoluteDirectory: string,
                directoryPart: string,
            ): Promise<void> => {
                const entries = await readdir(absoluteDirectory, { withFileTypes: true });

                for (const entry of entries) {
                    if (!showHiddenEntries && entry.name.startsWith(".")) {
                        continue;
                    }
                    if (
                        entry.isDirectory()
                        && RECURSIVE_MENTION_IGNORED_DIRECTORIES.has(entry.name)
                    ) {
                        continue;
                    }

                    const path = directoryPart ? `${directoryPart}/${entry.name}` : entry.name;
                    const kind: MentionCandidate["kind"] =
                        entry.isDirectory() ? "directory" : "file";

                    if (entry.name.toLowerCase().startsWith(lowercasePrefix)) {
                        fallbackMatches.push({
                            path: kind ==="directory" ? `${path}/` : path,
                            kind,
                        });
                        if (fallbackMatches.length >= MAX_FALLBACK_MENTION_CANDIDATES) {
                            return;
                        }
                    }

                    if (entry.isDirectory()) {
                        await visit(resolve(absoluteDirectory, entry.name), path);
                        if (fallbackMatches.length >= MAX_FALLBACK_MENTION_CANDIDATES) {
                            return;
                        }
                    }
                }
            };
        await visit(CURRENT_DIRECTORY, "");
        return fallbackMatches.sort((left, right) => left.path.localeCompare(right.path));    
    }   catch {
        return [];
    }
}

type FileMentionMenuProps = {
    candidates: MentionCandidate[];
    selectedIndex: number;
    scrollRef: RefObject<ScrollBoxRenderable | null>;
    onSelect: (index: number) => void;
    onExecute: (index: number) => void;
}

function FileMentionMenu({ candidates, selectedIndex, scrollRef, onSelect, onExecute}: FileMentionMenuProps) {
    const visibleHeight = Math.min(candidates.length, MAX_VISIBLE_MENTIONS);

    if (candidates.length === 0) {
        return (
            <box paddingX={1}>
                <text attributes={TextAttributes.DIM}>No matching files or folders</text>
            </box>
        );
    }

    return (
        <scrollbox ref={scrollRef} height={visibleHeight}>
            {candidates.map((candidate, index) => {
                const isSelected = index === selectedIndex;

                return (
                    <box key={candidate.path} flexDirection="row" paddingX={1} height={1} overflow="hidden" backgroundColor={isSelected ? "#89B4FA" : undefined} onMouseMove={() => onSelect(index)} onMouseDown={() => onExecute(index)}> 
                        <box flexGrow={1} flexShrink={1} overflow="hidden">
                            <text selectable={false} fg={isSelected ? "black" : "white"}>
                                {candidate.path}
                            </text>
                        </box>

                        <box width={8} alignItems="flex-end" flexShrink={0}>
                            <text selectable={false} fg={isSelected ? "black" : "gray"}>
                                {candidate.kind === "directory" ? "Folder" : "File"}
                            </text>
                        </box>
                    </box>
                )
            })}
        </scrollbox>
    )
};

type Props = {
    onSubmit: (text: string) => void;
    disabled?: boolean;
}


export const TEXTAREA_KEY_BINDINGS: KeyBinding[] = [  // defines what keys do, here "true" means being held together
    {name: "return", action: "submit"},
    {name:"enter", action: "submit"},
    {name: "return", shift: true, action: "newline"},
    {name: "enter", shift: true, action: "newline"},
];

export function InputBar ({onSubmit, disabled = false}: Props) { 
    const { mode, toggleMode, setMode, setModel } = usePromptConfig();
    const textareaRef = useRef<TextareaRenderable>(null);
    const onSubmitRef = useRef<() =>void>(() => {});
    const activeMentionRef = useRef<MentionMatch | null>(null)
    const mentionScrollRef = useRef<ScrollBoxRenderable>(null);

    const navigate = useNavigate()
    const renderer = useRenderer();
    const toast = useToast();
    const dialog = useDialog();
    const { isTopLayer, setResponder, push, pop } = useKeyboardLayer();
    const [activeMention, setActiveMention] = useState<MentionMatch | null>(null);
    const [mentionCandidates, setMentionCandidates] = useState<MentionCandidate[]>([]);
    const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
 
    const {
        showCommandMenu,
        commandQuery,
        selectedIndex,
        scrollRef,
        handleContentChange,
        resolveCommand,
        setSelectedIndex,
    } = useCommandMenu();
    const showMentionMenu = activeMention !== null;

    const closeMentionMenu = useCallback(() => {
        activeMentionRef.current = null;
        setActiveMention(null);
        setMentionCandidates([]);
        pop("mention");   
    }, [pop]);

    const syncMentionMenu = useCallback(
        (text: string, cursorOffset: number) => {
            const nextMention = findActiveMention(text, cursorOffset);
            const previousMention = activeMentionRef.current;
            const mentionChanged =
                previousMention?.start !== nextMention?.start ||
                previousMention?.end !== nextMention?.end ||
                previousMention?.query !== nextMention?.query;

            if (!nextMention) {
                if (previousMention) {
                    closeMentionMenu();
                }
                return
            };

            activeMentionRef.current = nextMention;
            setActiveMention(nextMention);
            push("mention", () => {
                closeMentionMenu();
                return true;
            });

            if (mentionChanged) {
                setMentionSelectedIndex(0);
                mentionScrollRef.current?.scrollTo(0);
            };
            
        }, [closeMentionMenu, push]);

    const handleTextareaContentChange = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const text = textarea.plainText

        handleContentChange(textarea.plainText);
            syncMentionMenu(text, textarea.cursorOffset);
    },[handleContentChange, syncMentionMenu]);

    const handleSubmit = useCallback(() => {    
        if (disabled) return;

        const textarea = textareaRef.current;
        if (!textarea) return;// if there is no text area so an early return

        const text = textarea.plainText.trim();
        if (text.length === 0) return;// if user inputs nothing then submits just go back to normal resting page

        onSubmit(text);
        textarea.setText("") // After submitting clear previous text and replace with a blank space 
    }, [disabled, onSubmit]);

    const handleMentionExecute = useCallback((index: number) => {
        const textarea= textareaRef.current;
        const mention = activeMentionRef.current;
        const candidate = mentionCandidates[index];

        if (!textarea || !mention || !candidate) return;

        const insertion = candidate.kind === "directory"
            ? candidate.path
            : `${candidate.path} `;

        const nextText = `${textarea.plainText.slice(0,mention.start)}@${insertion}${textarea.plainText.slice(mention.end)}`;

        textarea.replaceText(nextText);
        textarea.cursorOffset = mention.start + insertion.length +1;
        syncMentionMenu(nextText, textarea.cursorOffset);
    }, [mentionCandidates, syncMentionMenu]);

    const handleTextareaCursorChange = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        
        syncMentionMenu(textarea.plainText, textarea.cursorOffset)
    }, [syncMentionMenu]);

    const handleCommand = useCallback((// how to handle command
        command: Command | undefined
    ) => {
        const textarea = textareaRef.current;
        if (!textarea || !command) return;// if there is no text area or no command so an early return

        textarea.setText("");
        if (command.action) { // if the command has an action, execute it
            command.action({
                exit: () => renderer.destroy(),
                toast,
                dialog,
                navigate,
                mode,
                setMode,
                setModel,
            });
        } else {//if it doesnt have an action insert command and add a blank space
            textarea.insertText(command.value + " ")
        }
    }, [renderer, toast, dialog, navigate, mode, setMode, setModel]);

    const handleCommandExecute = useCallback ( // executes the command when necessary 
        (index: number) => {
            const command = resolveCommand(index);
            handleCommand(command);
        },
    [resolveCommand, handleCommand],);


    //Wire up textarea submit handler once so it always reads the latest state
    useEffect(() => {
        const textarea = textareaRef.current;
        if(!textarea) return;

        textarea.onSubmit = () => {
            onSubmitRef.current();
        };
    }, []);

    onSubmitRef.current = ()=> {
        if (disabled) return;

        if (showCommandMenu) {// if the command menu is open execute command
            const command = resolveCommand(selectedIndex);
            handleCommand(command);
            return;
        }

        if (showMentionMenu) {
            const candidate = mentionCandidates[mentionSelectedIndex];
            if (candidate) {
                handleMentionExecute(mentionSelectedIndex);
                return;
            }
        }
        handleSubmit();// if its not open it will submit the text
    };

    useKeyboard((key) => {
        if(disabled) return;
        if (!isTopLayer("base")) return;
        if (key.name === "tab") {
            key.preventDefault();
            toggleMode();
        }
    });

    //Keep the file picker in sync with the current @mention token
    useEffect(() => {
        if (!activeMention) {
            setMentionCandidates([]);
            return;
        }

        let ignore = false;
        const loadCandidates= async () => {
            const nextCandidates = await getMentionCandidates(activeMention.query);
            if (ignore) return;

            setMentionCandidates(nextCandidates);
            setMentionSelectedIndex((currentIndex) => {
                if (nextCandidates.length === 0) {
                    return 0;
                }
                return Math.min(currentIndex, nextCandidates.length - 1)
            });
        };

        void loadCandidates();

        return () => {
            ignore = true
        }
    }, [activeMention]);

    //Register the base layer responder for ctrl c dismissal
    useEffect(() => {
        setResponder("base", ()=> {
            if (disabled) return false;
        
            const textarea = textareaRef.current;
            if (textarea && textarea.plainText.length > 0) {
                textarea.setText("");// if there is text in the text area clears it
                return true;
            }
            return false;
        });
        return () => setResponder("base", null);
    }, [disabled, setResponder]); 

    useKeyboard((key) => {
        if (disabled) return;
        if (!showMentionMenu || !isTopLayer("mention")) return;

        if (key.name === "escape") {
            key.preventDefault();
            closeMentionMenu();
        } else if (key.name === "up") {
            key.preventDefault();
            setMentionSelectedIndex((currentIndex) => {
                const nextIndex = Math.max(0, currentIndex - 1);
                const scrollbox = mentionScrollRef.current;
                if (scrollbox && nextIndex < scrollbox.scrollTop) {
                    scrollbox.scrollTo(nextIndex);
                }
                return nextIndex;
            });
        } else if (key.name === "down") {
            key.preventDefault();
            setMentionSelectedIndex((currentIndex) => {
                if (mentionCandidates.length === 0) {
                    return 0;
                }

                const nextIndex = Math.min(mentionCandidates.length - 1, currentIndex + 1);
                const scrollbox = mentionScrollRef.current;

                if (scrollbox) {
                    const viewportHeight = scrollbox.viewport.height;
                    const visibleEnd = scrollbox.scrollTop + viewportHeight - 1;
                    if (nextIndex > visibleEnd) {
                        scrollbox.scrollTo(nextIndex - viewportHeight + 1)
                    }
                }

                return nextIndex;
            });
        }
    });

    return ( // Here we run Command menu we have to pass on the attributes required by the component as defined in its file like query 
        <box width="100%" justifyContent="center">
            <box border={["left"]} borderColor={mode === Mode.BUILD ? "blue" : "cyan"}>
                <box position="relative" justifyContent="center" paddingX={2} paddingY={1} backgroundColor="#1A1A24" width="100%" gap={1}>
                    {showCommandMenu && (// here is where it would only showw command menu when showwommandmenu is true
                        <box position="absolute" bottom="100%" left={0} width="100%" backgroundColor="#1A1A24" zIndex={10}>
                            <CommandMenu query={commandQuery} selectedIndex={selectedIndex} scrollRef={scrollRef} onSelect={setSelectedIndex} onExecute={handleCommandExecute}/>
                        </box>
                    )}  
                    {!showCommandMenu && showMentionMenu && (
                        <box position="absolute" bottom="100%" left={0} width="100%" backgroundColor="#1A1A24" zIndex={10}>
                            <FileMentionMenu candidates={mentionCandidates} selectedIndex={mentionSelectedIndex} scrollRef={mentionScrollRef} onSelect={setMentionSelectedIndex} onExecute={handleMentionExecute} />
                        </box>
                    )}
                    <textarea ref={textareaRef} focused={!disabled && (isTopLayer("base") || isTopLayer("command") || isTopLayer("mention"))} placeholder={`Ask anything... "Fix a bug in the database"`} keyBindings={TEXTAREA_KEY_BINDINGS} onContentChange={handleTextareaContentChange} />
                    <StatusBar />
                </box>
            </box>
        </box>
    )
} 