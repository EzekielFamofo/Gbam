import { Mode } from "@nightcode/database/enums";
import { Text, TextAttributes } from "@opentui/core";
import type { ClientMessagePart, ClientToolCallPart } from "src/hooks/use-chat";

// Component in AI conversation with user
type Props = {
    parts: ClientMessagePart[];
    model: string;
    mode: Mode;
    duration?: string;
    streaming?: boolean;
    interrupted?: boolean;
};

function formatToolName(name: string): string {
    return name
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/^./, (c) => c.toUpperCase());
}

function formatToolArgs(tc: ClientToolCallPart): string {
    return Object.values(tc.args).map(String).join("");
}

type PartGroup = {
    type: ClientMessagePart["type"];
    parts: ClientMessagePart[];
    key: string;
};

function groupConsecutiveParts(parts: ClientMessagePart[]): PartGroup[] {
    const groups: PartGroup[] = [];
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i]!;
        const lastGroup = groups[groups.length - 1];

        if (lastGroup && lastGroup.type === part.type) {
            lastGroup.parts.push(part);
        } else {
            const key =
                part?.type === "tool-call" ? `group-tc-${part.id}` : `group-${part?.type}-${i}`;
            groups.push({ type: part?.type, parts: [part], key });
        }
    }

    return groups;
}

export function BotMessage({ parts, model, mode, duration, streaming = false, interrupted = false }: Props) {
    return (
        <box width="100%" alignItems="center">
            {groupConsecutiveParts(parts).map((group) => {
                if (group.type === "reasoning") {
                    return (
                        <box key={group.key} paddingY={1} width="100%" paddingX={2} border={["left"]} borderColor="#CF8EF4">
                            {group.parts.map((part, j) => {
                                if (part.type !== "reasoning") return null;
                                return (
                                    <text key={`reasoning-${j}`} attributes={TextAttributes.DIM}>
                                        {j === 0 ? <em fg="#CF8EF4">Thinking:</em> : null} {part.text}
                                    </text>
                                );
                            })}
                        </box>
                    );
                }

                if (group.type === "tool-call") {
                    return (
                        <box key={group.key} paddingY={1} width="100%" paddingX={2} border={["left"]} borderColor="cyan">
                            {group.parts.map((part) => {
                                if (part.type !== "tool-call") return null;
                                return (
                                    <text key={part.id} attributes={TextAttributes.DIM}>
                                        <em fg="cyan">{formatToolName(part.name)}:</em>{" "}
                                        {formatToolArgs(part)}
                                        {part.status === "calling" ? " ..." : ""} 
                                    </text>
                                );
                            })}
                        </box>
                    );
                }

                if (group.type === "text") {
                    return (
                        <box key={group.key} paddingY={1} width="100%">
                            {group.parts.map((part, j) => {
                                if (part.type !== "text") return null;
                                return (
                                    <box key={`text-${j}`} paddingX={3} width="100%">
                                        <text>{part.text}</text>
                                    </box>
                                );
                            })}
                        </box>
                    );
                }

                return null;
            })}
            
            <box paddingX={3} paddingBottom={1} gap={1} width="100%">
                <box flexDirection="row" gap={2}>
                    <text attributes={interrupted ? TextAttributes.DIM : 0} fg={interrupted ? undefined : mode === Mode.PLAN ? "#56D6C2" : "blue"}>
                        ◉
                    </text>
                    <box flexDirection="row" gap={1}>               
                        <text attributes={interrupted ? TextAttributes.DIM : 0}>
                            {mode === Mode.PLAN ? "Plan" : "Build"}
                        </text>
                        <text attributes={TextAttributes.DIM} fg="#4E4E66">
                            ›
                        </text>
                        <text attributes={TextAttributes.DIM}>{model}</text>
                        {(duration || interrupted) && (
                            <>
                                <text attributes={TextAttributes.DIM} fg="#4E4E66">
                                    ›
                                </text>
                                <text attributes={TextAttributes.DIM}>{interrupted ? "interrupted" : duration}</text>
                            </>
                        )}
                    </box>
                </box>
            </box>
        </box>
    );
}