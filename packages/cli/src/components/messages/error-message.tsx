import { TextAttributes } from "@opentui/core";
import { MessageFrame } from "./message-frame";
import { UI_THEME } from "src/lib/ui-theme";

type Props = {
  message: string;
};

export function ErrorMessage({ message }: Props) {
  return (
    <MessageFrame
      accentColor={UI_THEME.errorAccent}
      header={
        <text attributes={TextAttributes.BOLD} fg={UI_THEME.errorAccent}>
          Problem
        </text>
      }
    >
      <text width="100%" wrapMode="word" attributes={TextAttributes.DIM}>
        {message}
      </text>
    </MessageFrame>
  );
}
