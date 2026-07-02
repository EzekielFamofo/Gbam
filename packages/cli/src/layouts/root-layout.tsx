import { Outlet } from "react-router";
import { DialogProvider } from "../components/providers/dialog";
import { KeyboardLayerProvider } from "../components/providers/keyboard-layer";
import { ToastProvider } from "../components/providers/toast";
import { useTerminalDimensions } from "@opentui/react";


export function RootLayout() {// layout for the folder
    const dimensions = useTerminalDimensions();

    return (
        <KeyboardLayerProvider>
            <ToastProvider>
                <DialogProvider>
                    <box position="absolute" left={0} top={0} width={dimensions.width} height={dimensions.height} flexDirection="column" backgroundColor="#1A1A24">
                        <Outlet />
                    </box>
                </DialogProvider>
            </ToastProvider>
        </KeyboardLayerProvider>
    )
}