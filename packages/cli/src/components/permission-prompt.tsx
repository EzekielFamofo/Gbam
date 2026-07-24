import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useState } from "react";

type PermissionPromptProps = {
  tool: string;
  target: string;
  onSelect: (choice: "yes" | "no" | "always") => void;
};

const OPTIONS = [
  { label: "Yes (Just this once)", value: "yes" },
  { label: "Always (For this session)", value: "always" },
  { label: "No (Deny)", value: "no" },
] as const;

export function PermissionPrompt({ tool, target, onSelect }: PermissionPromptProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useKeyboard((key) => {
    if (key.name === "up") {
      key.preventDefault();
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.name === "down") {
      key.preventDefault();
      setSelectedIndex((prev) => Math.min(OPTIONS.length - 1, prev + 1));
    } else if (key.name === "return" || key.name === "enter") {
      key.preventDefault();
      const option = OPTIONS[selectedIndex];
      if (option) {
        onSelect(option.value);
      }
    }
  });

  return (
    <box flexDirection="column" borderStyle="single" borderColor="yellow" padding={1} gap={1}>
      <box flexDirection="column">
        <text attributes={TextAttributes.BOLD}>
          ⚠️ GBAM wants to execute {tool} on {target}
        </text>
        <text>Do you want to allow this action?</text>
      </box>

      <box flexDirection="column">
        {OPTIONS.map((option, index) => {
          const isSelected = index === selectedIndex;
          return (
            <box key={option.value} flexDirection="row">
              <text attributes={isSelected ? TextAttributes.INVERSE : undefined}>
                {isSelected ? "❯ " : "  "}{option.label}
              </text>
            </box>
          );
        })}
      </box>
      
      <box flexDirection="row" width="100%">
        <text attributes={TextAttributes.DIM}>use arrow keys to select, enter to confirm</text>
      </box>
    </box>
  );
}