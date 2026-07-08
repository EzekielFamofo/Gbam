import { useCallback } from "react";
import { useNavigate } from "react-router";
import { Header } from "../components/header";
import { InputBar } from "../components/input-bar";
import { useTerminalDimensions } from "@opentui/react";

export function Home() {
    const navigate = useNavigate();
    const dimensions = useTerminalDimensions();

    const handleSubmit = useCallback(
        (text: string) => {
            navigate("/sessions/new", {state: {message: text} });
        },
        [navigate],
    );
// position="absolute" left={0} top={0} width={dimensions.width} height={dimensions.height} flexDirection="column"
    return (
        <box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} gap={2} position="relative" width="100%" height="100%" backgroundColor="#000000">
            <Header />
            <box width="100%" maxWidth={78} padding={2}>
                <InputBar onSubmit={handleSubmit} />
            </box>
        </box>
    )
};