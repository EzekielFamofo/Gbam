import { TextAttributes } from "@opentui/core";
import { type ModeType } from "@gbam/shared";
import prettyMs from "pretty-ms";
import type { Message } from "src/hooks/use-chat";
import { getModeAccent, getModeLabel, UI_THEME } from "src/lib/ui-theme";
import { MessageFrame } from "./message-frame";

type ClientMessagePart = Message["parts"][number];
type ToolPart = Extract<ClientMessagePart, { type: `tool-${string}` | "dynamic-tool" }>;

type Props = {
  parts: ClientMessagePart[];
  model: string;
  mode: ModeType;
  durationMs?: number;
  streaming?: boolean;
};

type RenderBlock =
  | { kind: "text"; key: string; text: string }
  | { kind: "reasoning"; key: string; text: string }
  | {
      kind: "tool";
      key: string;
      name: string;
      args: string;
      state?: string;
      errorText?: string;
    };

function formatToolName(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (character) => character.toUpperCase());
}

function isToolPart(part: ClientMessagePart): part is ToolPart {
  return part.type === "dynamic-tool" || part.type.startsWith("tool-");
}

function formatToolArgs(part: ToolPart): string {
  if (!("input" in part) || part.input == null) return "";
  if (typeof part.input !== "object") return String(part.input);

  return Object.entries(part.input)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" • ");
}

function toRenderBlocks(parts: ClientMessagePart[]): RenderBlock[] {
  const blocks: RenderBlock[] = [];

  for (let index = 0; index < parts.length; index++) {
    const part = parts[index]!;
    const previousBlock = blocks[blocks.length - 1];

    if (part.type === "text") {
      if (previousBlock?.kind === "text") {
        previousBlock.text += part.text;
      } else {
        blocks.push({ kind: "text", key: `text-${index}`, text: part.text });
      }
      continue;
    }

    if (part.type === "reasoning") {
      if (previousBlock?.kind === "reasoning") {
        previousBlock.text += `${previousBlock.text ? "\n" : ""}${part.text}`;
      } else {
        blocks.push({ kind: "reasoning", key: `reasoning-${index}`, text: part.text });
      }
      continue;
    }

    if (isToolPart(part)) {
      const name = part.type === "dynamic-tool" ? part.toolName : part.type.slice("tool-".length);
      blocks.push({
        kind: "tool",
        key: part.toolCallId,
        name,
        args: formatToolArgs(part),
        state: part.state,
        errorText: part.state === "output-error" ? part.errorText : undefined,
      });
    }
  }

  return blocks;
}

function ToolState({ state, errorText }: { state?: string; errorText?: string }) {
  if (state === "output-error") {
    return (
      <text attributes={TextAttributes.DIM} fg={UI_THEME.errorAccent}>
        Error: {errorText ?? "Tool execution failed"}
      </text>
    );
  }

  if (state && state !== "output-available") {
    return (
      <text attributes={TextAttributes.DIM} fg={UI_THEME.textMuted}>
        Running…
      </text>
    );
  }

  if (state === "output-available") {
    return (
      <text attributes={TextAttributes.DIM} fg={UI_THEME.textMuted}>
        Complete
      </text>
    );
  }

  return null;
}

export function BotMessage({ parts, model, mode, durationMs, streaming = false }: Props) {
  const accentColor = getModeAccent(mode);
  const blocks = toRenderBlocks(parts);

  return (
    <MessageFrame
      accentColor={accentColor}
      header={
        <text fg={accentColor} attributes={TextAttributes.BOLD}>
          GBAM
        </text>
      }
      footer={
        <box flexDirection="row" gap={1}>
          <text fg={accentColor}>◉</text>
          <text>{getModeLabel(mode)}</text>
          <text attributes={TextAttributes.DIM} fg={UI_THEME.textMuted}>
            ›
          </text>
          <text attributes={TextAttributes.DIM} fg={UI_THEME.textMuted}>
            {model}
          </text>
          <text attributes={TextAttributes.DIM} fg={UI_THEME.textMuted}>
            ›
          </text>
          {streaming ? (
            <text attributes={TextAttributes.DIM} fg={accentColor}>
              Streaming…
            </text>
          ) : durationMs != null ? (
            <text attributes={TextAttributes.DIM} fg={UI_THEME.textMuted}>
              {prettyMs(durationMs)}
            </text>
          ) : (
            <text attributes={TextAttributes.DIM} fg={UI_THEME.textMuted}>
              Complete
            </text>
          )}
        </box>
      }
    >
      {blocks.length === 0 ? (
        <text attributes={TextAttributes.DIM} fg={UI_THEME.textMuted}>
          {streaming ? "Waiting for output…" : "No response content"}
        </text>
      ) : (
        blocks.map((block) => {
          if (block.kind === "text") {
            return (
              <box key={block.key} width="100%">
                <text width="100%" wrapMode="word">
                  {block.text}
                </text>
              </box>
            );
          }

          if (block.kind === "reasoning") {            return (
              <box key={block.key} width="100%" flexDirection="row" overflow="hidden">
                <box width={1} backgroundColor={UI_THEME.reasoningAccent} flexShrink={0} />
                <box flexGrow={1} paddingLeft={1} flexDirection="column" gap={1}>
                  <text attributes={TextAttributes.DIM} fg={UI_THEME.reasoningAccent}>
                    Thinking
                  </text>
                  <text width="100%" wrapMode="word" attributes={TextAttributes.DIM} fg={UI_THEME.textMuted}>
                    {block.text}
                  </text>
                </box>
              </box>
            );
          }

          return (
            <box key={block.key} width="100%" flexDirection="row" overflow="hidden">
              <box width={1} backgroundColor={UI_THEME.toolAccent} flexShrink={0} />
              <box flexGrow={1} paddingLeft={1} flexDirection="column" gap={1}>
                <box flexDirection="row" gap={1}>
                  <text attributes={TextAttributes.DIM} fg={UI_THEME.toolAccent}>
                    {formatToolName(block.name)}
                  </text>
                  <ToolState state={block.state} errorText={block.errorText} />
                </box>
                {block.args ? (
                  <text width="100%" wrapMode="word" attributes={TextAttributes.DIM} fg={UI_THEME.textMuted}>
                    {block.args}
                  </text>
                ) : null}
              </box>
            </box>
          );
        })
      )}
    </MessageFrame>
  );
}
