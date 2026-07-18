import { TextAttributes } from "@opentui/core";
import { usePromptConfig } from "src/providers/prompt-config";
import { getModeAccent, getModeLabel, UI_THEME } from "src/lib/ui-theme";

export function StatusBar() {
  const { mode, model } = usePromptConfig();
  const accentColor = getModeAccent(mode);

  return (
    <box flexDirection="row" gap={1}>
      <text fg={accentColor}>{getModeLabel(mode)}</text>
      <text attributes={TextAttributes.DIM} fg={UI_THEME.textMuted}>
        ›
      </text>
      <text fg={UI_THEME.textMuted}>{model}</text>
    </box>
  );
}
