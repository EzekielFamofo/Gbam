import { TextAttributes } from "@opentui/core";
import { type ModeType } from "@gbam/shared";
import { getModeAccent, getModeLabel, UI_THEME } from "src/lib/ui-theme";
import { MessageFrame } from "./message-frame";

type Props = {
  message: string;
  mode: ModeType;
};

export function UserMessage({ message, mode }: Props) {
  const accentColor = getModeAccent(mode);

  return (
    <MessageFrame
      accentColor={accentColor}
      backgroundColor={UI_THEME.surfaceElevated}
      header={
        <box flexDirection="row" gap={1}>
          <text fg={accentColor} attributes={TextAttributes.BOLD}>
            You
          </text>
          <text attributes={TextAttributes.DIM} fg={UI_THEME.textMuted}>
            {getModeLabel(mode)}
          </text>
        </box>
      }
    >
      <text width="100%" wrapMode="word">
        {message}
      </text>
    </MessageFrame>
  );
}
