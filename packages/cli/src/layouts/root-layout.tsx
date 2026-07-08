import { Outlet } from "react-router";
import { DialogProvider } from "../providers/dialog";
import { KeyboardLayerProvider } from "../providers/keyboard-layer";
import { ToastProvider } from "../providers/toast";
import { useTerminalDimensions } from "@opentui/react";
import { PromptConfigProvider } from "src/providers/prompt-config";


export function RootLayout() {// layout for the folder
    const dimensions = useTerminalDimensions();

    return (
        <KeyboardLayerProvider>
            <ToastProvider>
                <DialogProvider>
                    <PromptConfigProvider>
                        <box position="absolute" left={0} top={0} width={dimensions.width} height={dimensions.height} flexDirection="column" backgroundColor="#1A1A24">
                            <Outlet />
                        </box>
                    </PromptConfigProvider>
                </DialogProvider>
            </ToastProvider>
        </KeyboardLayerProvider>
    )
}