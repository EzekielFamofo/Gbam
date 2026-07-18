import { memo, type ReactNode } from "react";
import { InputBar } from "./input-bar";
import { TranscriptPane } from "./transcript-pane";
import { SessionFooter } from "./session-footer";
import { UI_THEME } from "src/lib/ui-theme";

type Props = {
  children?: ReactNode;
  onSubmit: (text: string) => void;
  inputDisabled?: boolean;
  loading?: boolean;
  interruptible?: boolean;
};

const ComposerPane = memo(function ComposerPane({
  onSubmit,
  inputDisabled,
}: {
  onSubmit: (text: string) => void;
  inputDisabled: boolean;
}) {
  return (
    <box flexShrink={0}>
      <InputBar onSubmit={onSubmit} disabled={inputDisabled} />
    </box>
  );
});

export function SessionShell({
  children,
  onSubmit,
  inputDisabled = false,
  loading = false,
  interruptible = false,
}: Props) {
  return (
    <box
      flexDirection="column"
      flexGrow={1}
      width="100%"
      height="100%"
      paddingY={1}
      paddingX={2}
      gap={1}
      backgroundColor={UI_THEME.background}
    >
      <TranscriptPane>{children}</TranscriptPane>
      <ComposerPane onSubmit={onSubmit} inputDisabled={inputDisabled} />
      <SessionFooter loading={loading} interruptible={interruptible} />
    </box>
  );
}
