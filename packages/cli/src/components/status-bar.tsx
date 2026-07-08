import { Mode } from "@nightcode/database/enums";
import { DEFAULT_CHAT_MODEL_ID } from "@nightcode/shared";
import { TextAttributes } from "@opentui/core";
import { usePromptConfig } from "src/providers/prompt-config";

export function StatusBar() {
    const { mode, model } = usePromptConfig();

    return (
        <box flexDirection="row" gap={1}>
            <text fg={ mode === Mode.PLAN ? "cyan" : "blue" }>{mode === Mode.PLAN ? "Plan" : "Build"}</text>
            <text attributes={TextAttributes.DIM} fg="gray">
                ›
            </text>
            <text>{model}</text>
        </box>
    )
}