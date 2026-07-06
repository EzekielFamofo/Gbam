import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { DialogConfig } from "./types"
import { useKeyboardLayer } from "../keyboard-layer";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { RGBA, TextAttributes } from "@opentui/core";

export type DialogContextValue = { // setting up the functions we would use later, dialogue would be used in command
    open: (config: DialogConfig) => void;
    close: () => void;
};

const DialogContext =createContext<DialogContextValue | null>(null); // allows the dialog to be used later anywhere in the application

export function useDialog(): DialogContextValue { // Dialogue must have text in it (value) if not would throw an error
    const value = useContext(DialogContext);
    if(!value) {
        throw new Error("useDialog must be used within a DialogProvider")
    }
    return value;
}
type DialogProviderProps = {
    children: ReactNode;
}

export function DialogProvider({children}: DialogProviderProps) {
    const [currentDialog, setCurrentDialog] = useState<DialogConfig | null>(null);
    const {push, pop } = useKeyboardLayer();

    const close = useCallback(() => { // defining the functions, this is also integrated with the keyboardlayer that was built
        setCurrentDialog(null);
        pop("dialog");
    }, [pop]);

    const open = useCallback((config: DialogConfig) => {
        setCurrentDialog(config);
        push("dialog", () => {// on ctrl C would close the dialogue
            close()
            return true;
        })
    }, [push, close]);

    const value: DialogContextValue = {
        open,
        close,
    };
    return (
       <DialogContext.Provider value={value}>
            {children}
            <Dialog currentDialog={currentDialog} close={close}  />
       </DialogContext.Provider> 
    );

};

type DialogProps = {
    currentDialog: DialogConfig | null;
    close: () => void
};

function Dialog({currentDialog, close }: DialogProps){
    const {isTopLayer} = useKeyboardLayer();
    const dimensions = useTerminalDimensions();

    useKeyboard((key) => {
        if (!currentDialog || !isTopLayer("dialog")) return;// if dialog is not open or if dialog is not top layer it will not register ctrl c
    
        if (key.name === "escape") {
            close();
        }
    });
    if (!currentDialog) {
        return null;
    }

    const {title, children } = currentDialog;

    return ( // the actual appereance of the dialog component
        <box position="absolute" left={0} top={0} width={dimensions.width} height={dimensions.height} justifyContent="center" alignItems="center" backgroundColor={RGBA.fromInts(0,0, 0, 150)} zIndex={100} onMouseDown={() => close()}>
            <box width={Math.min(60, dimensions.width - 4)} height="auto" backgroundColor="#1A1A24" paddingX={4} paddingY={1} flexDirection="column" gap={1} onMouseDown={(e) => e.stopPropagation()}>
                <box paddingBottom={1} flexDirection="row" alignItems="center" justifyContent="space-between">
                    <text attributes={TextAttributes.BOLD}>{title}</text>
                    <text attributes={TextAttributes.DIM} onMouseDown={() => close()} >esc</text>
                </box>
                <box flexGrow={1}>
                        {children}
                </box>
            </box>
        </box>
    );
};


