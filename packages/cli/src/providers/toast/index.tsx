import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { DEFAULT_DURATION, type ToastOptions, type ToastVariant } from "./types"
import { useTerminalDimensions } from "@opentui/react";
// This  is to allow any component in the app to trigger a toast notification without having to type everything manually in several places
export type ToastContextValue = {
    show: (options:ToastOptions) => void; //context value only contains a single function called show
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
    const value = useContext(ToastContext);
    if (!value) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return value;
};

type ToastProviderProps = {
    children: ReactNode;
};

export function ToastProvider({children}: ToastProviderProps) {
    const [currentToast, setCurrentToast] = useState<ToastOptions | null>(null);
    const timeoutHandleRef = useRef<NodeJS.Timeout | null>(null);

    const clearCurrentTimeout = useCallback(() => {// Just a way to clear the timeout
        if (timeoutHandleRef.current) {
            clearTimeout(timeoutHandleRef.current);
            timeoutHandleRef.current = null
        }
    }, []);

    const show = useCallback((options: ToastOptions) => {  // as was defined above, passed on the parametric required
        const duration = options.duration ?? DEFAULT_DURATION // sets the duration to 3s or otherwise specified, toastoptions parametrics come from types.ts
    
        clearCurrentTimeout();// must clear previous toast before showing another one

        setCurrentToast({
            variant: options.variant ?? "info",// sets default variant to infro if no variant is included or if variant is not one of 3 defined
            ...options,
            duration,
        });

        timeoutHandleRef.current = setTimeout(() => {// this handles the length that the toast is shown
            setCurrentToast(null); // when the time finishs sets it to null
        }, duration).unref();
    }, [clearCurrentTimeout]);

    const value = useMemo(() => ({ show }), [show]);

    return ( // wraps the entire code so as to allow the toast context to be called  in any child component in the application
        <ToastContext.Provider value={value}>
            {children} 
            <Toast currentToast={currentToast} />
        </ToastContext.Provider>
    );//Here children represent the application UI
};


type ToastProps = {
    currentToast: ToastOptions | null;
};

function Toast({currentToast}: ToastProps) {
    const {width} = useTerminalDimensions();

    if (!currentToast)   {
        return null;
    };//if there is no toast showing  return nothing

    const variantColors: Record<ToastVariant, string> = {// can only define colors for the variants that is included in ToastVariant
        success: "#82E0AA",
        error: "#E74C5E",
        info: "#56D6C2",
    };

    const borderColor = currentToast.variant
    ? variantColors[currentToast.variant]//if no variant passed uses info coloring
    : variantColors.info;

    return ( // the actual appareance for the toast and the message in the toast
        <box position="absolute" justifyContent="center" alignItems="flex-start" top={2} right={2} width={Math.max(1,Math.min(60,width-6))} paddingLeft={2} paddingRight={2} paddingTop={1} paddingBottom={1} backgroundColor="#1A1A24" borderColor={borderColor} border={["left", "right"]}>
            <box flexDirection="column" gap={1} width="100%">
                <text fg="#E1E1E1" wrapMode="word" width="100%">
                    {currentToast.message}
                </text>
            </box>
        </box>
    );
};
