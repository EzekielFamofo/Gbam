import { memo } from "react";
import type { Message } from "src/hooks/use-chat";
import { BotMessage } from "./bot-message";
import { UserMessage } from "./user-message";

type Props = {
  message: Message;
  streaming: boolean;
};

function getUserText(message: Message) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function TranscriptMessageComponent({ message, streaming }: Props) {
  if (message.role === "user") {
    return <UserMessage message={getUserText(message)} mode={message.metadata?.mode ?? "BUILD"} />;
  }

  return (
    <BotMessage
      parts={message.parts}
      model={message.metadata?.model ?? "unknown"}
      mode={message.metadata?.mode ?? "BUILD"}
      durationMs={streaming ? undefined : message.metadata?.durationMs}
      streaming={streaming}
    />
  );
}

function arePartsEqual(previous: Message["parts"], next: Message["parts"]) {
  if (previous.length !== next.length) return false;

  for (let index = 0; index < previous.length; index++) {
    if (JSON.stringify(previous[index]) !== JSON.stringify(next[index])) {
      return false;
    }
  }

  return true;
}

function areMessagesEqual(previous: Message, next: Message) {
  if (previous.id !== next.id || previous.role !== next.role) return false;
  if (!arePartsEqual(previous.parts, next.parts)) return false;

  return (
    previous.metadata?.mode === next.metadata?.mode &&
    previous.metadata?.model === next.metadata?.model &&
    previous.metadata?.durationMs === next.metadata?.durationMs
  );
}

export const TranscriptMessage = memo(TranscriptMessageComponent, (previous, next) => {
  return previous.streaming === next.streaming && areMessagesEqual(previous.message, next.message);
});
