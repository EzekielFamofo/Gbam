import { Mode, type ModeType } from "@gbam/shared";

export const UI_THEME = {
  background: "#05070C",
  surface: "#0B1118",
  surfaceElevated: "#101720",
  border: "#1A2330",
  text: "#E7EDF3",
  textMuted: "#7C8A9A",
  buildAccent: "#89B4FA",
  planAccent: "#56D6C2",
  reasoningAccent: "#CF8EF4",
  toolAccent: "#56D6C2",
  errorAccent: "#E74C5E",
} as const;

export function getModeAccent(mode: ModeType) {
  return mode === Mode.PLAN ? UI_THEME.planAccent : UI_THEME.buildAccent;
}

export function getModeLabel(mode: ModeType) {
  return mode === Mode.PLAN ? "Plan" : "Build";
}
