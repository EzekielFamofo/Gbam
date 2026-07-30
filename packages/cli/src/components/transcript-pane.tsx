import { memo, type ReactNode } from "react";

type Props = {
  children?: ReactNode;
};

function TranscriptPaneComponent({ children }: Props) {
  return (
    <scrollbox flexGrow={1} width="100%" stickyScroll stickyStart="bottom">
      <box width="100%" flexDirection="column" gap={1} paddingRight={1}>
        {children}
      </box>
    </scrollbox>
  );
}

export const TranscriptPane = memo(TranscriptPaneComponent);