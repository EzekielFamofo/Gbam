import { Mode, type ModeType } from "@nightcode/shared";
import { Text, TextAttributes } from "@opentui/core";
import type { Message } from "src/hooks/use-chat";
import prettyMs from "pretty-ms";

type ClientMessagePart = Message["parts"][number];
type ToolPart = Extract<ClientMessagePart, { type: `tool-${string}` | "dynamic-tool" }>;


// Component in AI conversation with user
type Props = {
    parts: ClientMessagePart[];
    model: string;
    mode: ModeType;
    durationMs?: number;
    streaming?: boolean;
};

function formatToolName(name: string): string {
    return name
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/^./, (c) => c.toUpperCase());
}

function isToolPart(part: ClientMessagePart): part is ToolPart {
    return part.type === "dynamic-tool" || part.type.startsWith("tool-")
};

function formatToolArgs(tc: ToolPart): string {
    if (!("input" in tc) || tc.input == null) return "";
    if (typeof tc.input !== "object") return String(tc.input)
    return Object.values(tc.input).map(String).join("");
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
                isToolPart(part) ? `group-tc-${part.toolCallId}` : `group-${part?.type}-${i}`;
            groups.push({ type: part.type, parts: [part], key });
        }
    }

    return groups;
}

export function BotMessage({ parts, model, mode, durationMs, streaming = false}: Props) {
    const groups = groupConsecutiveParts(parts);

    return (
        <box width="100%" alignItems="center">
            {groups.map((group, i) => {
                const prevGroup = groups[i - 1];
                
                // Helper checks to see if a group is a reasoning block or a tool call
                const isCurrentCompact = group.type === "reasoning" || group.type === "dynamic-tool" || group.type.startsWith("tool-");
                const isPrevCompact = prevGroup && (prevGroup.type === "reasoning" || prevGroup.type === "dynamic-tool" || prevGroup.type.startsWith("tool-"));
                
                // FIX: Condense the UI by dropping the top padding to 0 if transitioning between compact blocks
                const paddingTop = (i === 0 || (isCurrentCompact && isPrevCompact)) ? 0 : 1;

                return (
                    <box key={group.key} width="100%" paddingTop={paddingTop}>
                        {group.parts.map((part, j) => {
                            if (part.type === "reasoning") {
                                return (
                                    <box
                                        key={`reasoning-${j}`}
                                        border={["left"]}
                                        borderColor={"#34344A"}
                                        width="100%"
                                        paddingX={2}
                                    >
                                        <text attributes={TextAttributes.DIM}>
                                            <em fg="#CF8EF4">Thinking:</em> {part.text}
                                        </text>
                                    </box>
                                );
                            }

                            if (isToolPart(part)) {
                                const toolName =
                                    part.type === "dynamic-tool" ? part.toolName : part.type.slice("tool-".length);

                                return (
                                    <box
                                        key={part.toolCallId}
                                        border={["left"]}
                                        borderColor="#34344A"
                                        width="100%"
                                        paddingX={2}
                                    >
                                        <text attributes={TextAttributes.DIM}>
                                            <em fg="#56D6C2">{formatToolName(toolName)}:</em> {formatToolArgs(part)}
                                            {part.state !== "output-available" && part.state !== "output-error" 
                                                ? " …" 
                                                : ""
                                            }
                                            {part.state === "output-error" ? ` ${part.errorText}` : ""}
                                        </text>
                                    </box>
                                );
                            }

                            if (part.type === "text") {
                                return (
                                    <box key={`text-${j}`} paddingX={3} width="100%">
                                        <text>{part.text}</text>
                                    </box>
                                );
                            }
                            
                            return null;
                        })}
                    </box>
                );
            })}
            
            <box paddingX={3} paddingY={1} gap={1} width="100%">
                <box flexDirection="row" gap={2}>
                    <text fg={mode === Mode.PLAN ?"#56D6C2" : "blue" }>◉</text>
                    <box flexDirection="row" gap={1}>               
                        <text>
                            {mode === Mode.PLAN ? "Plan" : "Build"}
                        </text>
                        <text attributes={TextAttributes.DIM} fg="#4E4E66">
                            ›
                        </text>
                        <text attributes={TextAttributes.DIM}>{model}</text>
                        {(durationMs != null) && (
                            <>
                                <text attributes={TextAttributes.DIM} fg="#4E4E66">
                                    ›
                                </text>
                                <text attributes={TextAttributes.DIM}>{prettyMs(durationMs)}</text>
                            </>
                        )}
                    </box>
                </box>
            </box>
        </box>
    );
}