import { TextareaRenderable, type KeyBinding } from "@opentui/core";
import { StatusBar } from "./status-bar";
import { CommandMenu } from "./command-menu";
import { useCallback, useEffect, useRef } from "react";
import { useRenderer } from "@opentui/react";
import { useCommandMenu } from "./command-menu/use-command-menu";
import type {Command} from "./command-menu/type";
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
    const textareaRef = useRef<TextareaRenderable>(null);
    const onSubmitRef = useRef<() =>void>(() => {});
    const renderer = useRenderer();

    const {
        showCommandMenu,
        commandQuery,
        selectedIndex,
        scrollRef,
        handleContentChange,
        resolveCommand,
        setSelectedIndex,
    } = useCommandMenu();

    const handleCommandExecute = useCallback ( // executes the command when necessary 
        (index: number) => {
            const command = resolveCommand(index);
            handleCommand(command);
        },
    [],);

    const handleTextareaContentChange = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        handleContentChange(textarea.plainText);
    },[])

    const handleSubmit = useCallback(() => {    
        if (disabled) return;

        const textarea = textareaRef.current;
        if (!textarea) return;// if there is no text area so an early return

        const text = textarea.plainText.trim();
        if (text.length === 0) return;// if user inputs nothing then submits just go back to normal resting page

        onSubmit(text);
        textarea.setText("") // After submitting clear previous text and replace with a blank space 
    }, [disabled, onSubmit]);

    const handleCommand = useCallback((// how to handle command
        command: Command | undefined
    ) => {
        const textarea = textareaRef.current;
        if (!textarea || !command) return;// if there is no text area or no command so an early return

        textarea.setText("");
        if (command.action) { // if the command has an action, execute it
            command.action({
                exit: () => renderer.destroy(),
            });
        } else {//if it doesnt have an action insert command and add a blank space
            textarea.insertText(command.value + " ")
        }
    }, [renderer]);

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
        handleSubmit();// if its not open it will submit the text
    }

    return ( // Here we run Command menu we have to pass on the attributes required by the component as defined in its file like query 
        <box width="100%" alignItems="center">
            <box border={["left"]} borderColor="cyan">
                <box position="relative" justifyContent="center" paddingX={2} paddingY={1} backgroundColor="#1A1A24" width="100%" gap={1}>
                    {showCommandMenu && (// here is where it would only showw command menu when showwommandmenu is true
                        <box position="absolute" bottom="100%" left={0} width="100%" backgroundColor="#1A1A24" zIndex={10}>
                            <CommandMenu query={commandQuery} selectedIndex={selectedIndex} scrollRef={scrollRef} onSelect={setSelectedIndex} onExecute={handleCommandExecute}/>
                        </box>
                    )}
                    <textarea ref={textareaRef} focused={!disabled} placeholder={`Ask anything... "Fix a bug in the database"`} keyBindings={TEXTAREA_KEY_BINDINGS} onContentChange={handleTextareaContentChange} />
                    <StatusBar />
                </box>
            </box>
        </box>
    )
} 