import { memo } from "react";
import { TextAttributes } from "@opentui/core";
import { Spinner } from "./spinner";
import { usePromptConfig } from "src/providers/prompt-config";
import { UI_THEME } from "src/lib/ui-theme";

type Props = {
  loading?: boolean;
  interruptible?: boolean;
};

function SessionFooterComponent({ loading = false, interruptible = false }: Props) {
  const { mode } = usePromptConfig();

  return (
    <box
      flexShrink={0}
      flexDirection="row"
      justifyContent="space-between"
      width="100%"
      height={1}
      gap={2}
      paddingLeft={1}
    >
      <box flexDirection="row" alignItems="center" gap={2}>
        {loading ? (
          <box flexDirection="row" gap={1} alignItems="center">
            <Spinner mode={mode} />
            <text fg={UI_THEME.textMuted}>
              {interruptible ? "Streaming — esc to interrupt" : "Working…"}
            </text>
          </box>
        ) : null}
      </box>
      <box flexDirection="row" gap={1} flexShrink={0} marginLeft="auto">
        <text>tab</text>
        <text attributes={TextAttributes.DIM} fg={UI_THEME.textMuted}>
          agents
        </text>
        <text>ctrl R</text>
        <text attributes={TextAttributes.DIM} fg={UI_THEME.textMuted}>
          Rename Session
        </text>
        
      </box>
    </box>
  );
}

export const SessionFooter = memo(SessionFooterComponent);
