import { useState, useEffect } from "react";
import { Mode, type ModeType } from "@nightcode/shared";

type Props = {
    mode?: ModeType; 
}

// Define the frames for your animation
const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function Spinner({ mode = Mode.BUILD }: Props) {
    const [frame, setFrame] = useState(0);
    const activeColor = mode === Mode.PLAN ? "#56D6C2" : "blue";

    useEffect(() => {
        const interval = setInterval(() => {
            setFrame((prev) => (prev + 1) % FRAMES.length);
        }, 80); // Speed of the rotation

        return () => clearInterval(interval);
    }, []);

    return <text fg={activeColor}>{FRAMES[frame]}</text>;
}