import { useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { Header } from "../components/header";
import { InputBar } from "../components/input-bar";
import { usePromptConfig } from "src/providers/prompt-config";
import { useToast } from "src/providers/toast";
import { TextAttributes } from "@opentui/core";

export function Home() {
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const { mode, model } = usePromptConfig();

    useEffect(() => {
        if ((location.state as { dismissToastOnOpen?: boolean } | null)?.dismissToastOnOpen === true) {
            toast.hide();
        }
    }, [location.state, toast]);

    const handleSubmit = useCallback(
        (text: string) => {
            navigate("/sessions/new", {state: {message: text, mode, model} });
        },
        [navigate, mode, model],
    );
// position="absolute" left={0} top={0} width={dimensions.width} height={dimensions.height} flexDirection="column"
    return (
        <box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} gap={2} position="relative" width="100%" height="100%" backgroundColor="#000000">
            <Header />
            <box width="100%" maxWidth={78} padding={2}>
                <InputBar onSubmit={handleSubmit} />
                <box flexDirection="row" gap={1} flexShrink={0} marginLeft="auto">
                    <text>tab</text>
                    <text attributes={TextAttributes.DIM}>agents</text>
                </box>
            </box>
        </box>
    )
};