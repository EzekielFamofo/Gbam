import { useEffect, useState } from "react";
import { Mode, type ModeType } from "@gbam/shared";
import { UI_THEME } from "src/lib/ui-theme";

type Props = {
  mode?: ModeType;
};

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function Spinner({ mode = Mode.BUILD }: Props) {
  const [frame, setFrame] = useState(0);
  const activeColor = mode === Mode.PLAN ? UI_THEME.planAccent : UI_THEME.buildAccent;

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((previous) => (previous + 1) % FRAMES.length);
    }, 80);

    return () => clearInterval(interval);
  }, []);

  return <text fg={activeColor}>{FRAMES[frame]}</text>;
}
