import { InputRenderable, TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useCallback, useRef, useState } from "react";
import { useDialog } from "src/providers/dialog";

type RenameSessionDialogContentProps = {
  currentTitle: string;
  onSubmit: (newTitle: string) => Promise<void> | void;
};

export function RenameSessionDialogContent({
  currentTitle,
  onSubmit,
}: RenameSessionDialogContentProps) {
  const [value, setValue] = useState(currentTitle);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<InputRenderable>(null);
  const { close } = useDialog();

  const handleSubmit = useCallback(async () => {
    const text = inputRef.current?.value ?? value;
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(trimmed);
      close();
    } finally {
      setIsSubmitting(false);
    }
  }, [value, isSubmitting, onSubmit, close]);

  const handleContentChange = useCallback(() => {
    const text = inputRef.current?.value ?? "";
    setValue(text);
  }, []);

  useKeyboard((key) => {
    if (key.name === "escape") {
      key.preventDefault();
      close();
    } else if (key.name === "return" || key.name === "enter") {
      key.preventDefault();
      void handleSubmit();
    }
  });

  return (
    <box width="100%" flexDirection="column" gap={1}>
      <input
        ref={inputRef}
        value={value}
        placeholder="New session name..."
        focused
        onContentChange={handleContentChange}
      />

      <box flexDirection="row" justifyContent="flex-end" width="100%">
        <text attributes={TextAttributes.DIM}>enter to save</text>
      </box>
    </box>
  );
}