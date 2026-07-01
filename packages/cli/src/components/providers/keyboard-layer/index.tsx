import { useKeyboard, useRenderer } from "@opentui/react";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";

type Responder = () =>boolean;
// Right now we are trying to make different layers that would be affect by our keyboard differently when the user uses Ctrl C, we dont want it to close the application if the Command Menu is open or if there is text in the input bar, to fix this we use Layers
type KeyboardLayerContextValue = {// Here are different actions/functions that affects the layers here we define there type
    push: (id:string, responder?: Responder) => void// pushes to a higher layer
    pop: (id:string) => void // when a layer is closed it is 'popped' from the array
    isTopLayer:(id:string) => boolean// to help us know whether the shortcut should work on that layer
    setResponder: (id:string, responder: Responder | null) => void 
};

// the following is to allow the keyboard layer to work across the application UI
const KeyboardLayerContext = createContext<KeyboardLayerContextValue | null>(null); 

export function KeyboardLayerProvider({children}: {children: React.ReactNode}) {
    const [stack, setStack] = useState<string[]>(["base"])// Here we use an array of strings for the layers, the default value is base which is the home screen
    const stackRef= useRef(stack);// useRef is used here to ensure that the component does not rerender everytime the stack array changes 
    stackRef.current = stack;

    const responders = useRef<Map<string, Responder>>(new Map());
    const renderer = useRenderer();
    // here we start defining the ealier functions
    const push = useCallback((id: string, responder?: Responder) => {// we use useCallback to cache the function so it will not be recreate when the layer changes
        if (responder) {
            responders.current.set(id,responder)
        };

        setStack((prev) => {// if the layer already exists in the array wont add it to the array
            if (prev.includes(id)) {
                return prev
            }
            return [...prev, id];
        });

    }, []); 

    const pop = useCallback((id: string) => { // function to remove layer
        responders.current.delete(id);
        setStack((prev) => prev.filter((layer) => layer !==id))
    }, []);

    const isTopLayer = useCallback(// function to determine if a layer is the top layer
        (id: string) => {
            return stack.length === 0 || stack[stack.length -1] === id;
        },
        [stack],
    );
    const setResponder = useCallback((id: string, responder: Responder | null) => {//sets what layer responds to the ctrl c / shortcut
        if (responder ) {
            responders.current.set(id, responder);
        } else {
            responders.current.delete(id);
        }
    }, []);
    useKeyboard((key) => {// Using all previous functions to determine which layer ctrl c closes
        if (!key.ctrl || key.name !== "c") return; // if not ctrl key or c return(close)

        const currentStack = stackRef.current;
        for (let i = currentStack.length - 1; i >= 0; i--) {// loop of the items in our stack starting from the top
            const layerId = currentStack[i]!;
            const responder = responders.current.get(layerId);
            if (responder && responder()) {
                return;
            };

        };
        // if no responder handled it- close the application
        renderer.destroy();
    });
    return (// wraps the applicatio so it happens globally
        <KeyboardLayerContext.Provider value={{push,pop,isTopLayer,setResponder}}>
            {children}
        </KeyboardLayerContext.Provider>
    );
};

export function useKeyboardLayer () {
    const context = useContext(KeyboardLayerContext);
    if (!context) {
        throw new Error("useKeyboardLayer must be used within a KeyboardLayerProvider")
    }
    return context;
};

