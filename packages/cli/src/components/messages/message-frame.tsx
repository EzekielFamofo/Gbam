import type { ReactNode } from "react";
import { UI_THEME } from "src/lib/ui-theme";

type Props = {
  accentColor: string;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  backgroundColor?: string;
  contentGap?: number;
};

export function MessageFrame({
  accentColor,
  header,
  footer,
  children,
  backgroundColor = UI_THEME.surface,
  contentGap = 1,
}: Props) {
  return (
    <box width="100%" flexDirection="column">
      <box width="100%" flexDirection="row" overflow="hidden">
      <box width={1} backgroundColor={accentColor} flexShrink={0} />
      <box
        flexGrow={1}
        flexDirection="column"
        backgroundColor={backgroundColor}
        borderColor={UI_THEME.border}
        paddingX={2}
        paddingY={1}
        gap={1}
      >
        {header ? <box width="100%">{header}</box> : null}
        <box width="100%" flexDirection="column" gap={contentGap}>
          {children}
        </box>
        {footer ? <box width="100%">{footer}</box> : null}
      </box>
    </box>
    </box>
  );
}
