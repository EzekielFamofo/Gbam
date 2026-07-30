import type { UIMessage } from "ai";

export type ConversationCompactionOptions = {
  maxMessages: number;
  maxTotalChars: number;
  maxTextPartChars: number;
  maxToolPayloadStringChars: number;
};

type AnyUIMessage = UIMessage<any, any, any>;

export const MODEL_CONTEXT_COMPACTION_OPTIONS: ConversationCompactionOptions = {
  maxMessages: 8,
  maxTotalChars: 30_000,
  maxTextPartChars: 4_000,
  maxToolPayloadStringChars: 1_500,
};

export const SESSION_HISTORY_COMPACTION_OPTIONS: ConversationCompactionOptions = {
  maxMessages: 20,
  maxTotalChars: 80_000,
  maxTextPartChars: 6_000,
  maxToolPayloadStringChars: 2_500,
};

function truncateString(value: string, maxChars: number) {
  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, maxChars)}\n… [truncated ${value.length - maxChars} chars]`;
}

function truncateJsonStrings(
  value: unknown,
  maxChars: number,
  seen = new WeakSet<object>(),
): unknown {
  if (typeof value === "string") {
    return truncateString(value, maxChars);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => truncateJsonStrings(entry, maxChars, seen));
  }

  if (value && typeof value === "object") {
    if (seen.has(value)) {
      return "[Circular]";
    }

    seen.add(value);

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        truncateJsonStrings(nestedValue, maxChars, seen),
      ]),
    );
  }

  return value;
}

// Reasoning and tool-call/result parts can carry provider-issued continuity
// signatures (e.g. Gemini "thought signatures", OpenAI reasoning items) in
// their providerOptions/providerMetadata, or in some cases their id itself.
// These must round-trip back to the model unmodified on the next turn, or
// reasoning-capable models lose track of their own multi-step tool-calling
// logic ("reasoning drift") - more/duplicate tool calls, forgetting why a
// tool was called, degraded coherence.
function isSignatureCriticalPart(part: Record<string, unknown>): boolean {
  const type = typeof part.type === "string" ? part.type : "";
  return type === "reasoning" || type.startsWith("reasoning") || type === "dynamic-tool" || type.startsWith("tool-");
}

function compactMessagePart(
  part: unknown,
  options: ConversationCompactionOptions,
): Record<string, unknown> | null {
  if (!part || typeof part !== "object") {
    return null;
  }

  const basePart = { ...(part as Record<string, unknown>) };
  const signatureCritical = isSignatureCriticalPart(basePart);

  // Strip provider metadata & options - except on reasoning/tool parts,
  // where this is exactly where continuity signatures live.
  if (!signatureCritical) {
    delete basePart.providerMetadata;
    delete basePart.providerOptions;
    delete basePart.experimental_providerMetadata;
  }

  // Strip provider-assigned IDs from message parts if present - but not on
  // signature-critical parts. OpenAI Responses-API-style reasoning ("rs_")
  // and function-call ("fc_") ids may themselves be load-bearing for
  // continuity, not just inert bookkeeping - see caveat below.
  if (
    !signatureCritical &&
    typeof basePart.id === "string" &&
    (basePart.id.startsWith("msg_") || basePart.id.startsWith("rs_") || basePart.id.startsWith("fc_"))
  ) {
    delete basePart.id;
  }

  const partType = typeof basePart.type === "string" ? basePart.type : "";

  if (partType === "reasoning" || partType.startsWith("reasoning")) {
    // Previously `return null` - dropped the entire part, on every pass,
    // client-side before every request left the CLI and again server-side
    // right before convertToModelMessages. Now passed through completely
    // untouched: no truncation, no field stripping. "Drop whole message" is
    // still handled safely by the char/message-count window further down;
    // "modify in place" is what breaks signatures.
    return basePart;
  }

  if (partType === "text" && typeof basePart.text === "string") {
    return {
      ...basePart,
      text: truncateString(basePart.text, options.maxTextPartChars),
    };
  }

  if (partType === "dynamic-tool" || partType.startsWith("tool-")) {
    const compactedPart: Record<string, unknown> = { ...basePart };

    if ("input" in compactedPart) {
      compactedPart.input = truncateJsonStrings(
        compactedPart.input,
        options.maxToolPayloadStringChars,
      );
    }

    if ("output" in compactedPart) {
      compactedPart.output = truncateJsonStrings(
        compactedPart.output,
        options.maxToolPayloadStringChars,
      );
    }

    if (typeof compactedPart.errorText === "string") {
      compactedPart.errorText = truncateString(
        compactedPart.errorText,
        options.maxToolPayloadStringChars,
      );
    }

    return compactedPart;
  }

  return basePart;
}

function compactMessage<TMessage extends AnyUIMessage>(
  message: TMessage,
  options: ConversationCompactionOptions,
): TMessage | null {
  const compactedParts = message.parts.flatMap((part) => {
    const compactedPart = compactMessagePart(part, options);
    return compactedPart ? [compactedPart] : [];
  });

  if (compactedParts.length === 0) {
    return null;
  }

  const cleanMessage = {
    ...message,
    parts: compactedParts,
  } as unknown as Record<string, unknown>;

  delete cleanMessage.providerMetadata;
  delete cleanMessage.providerOptions;
  delete cleanMessage.experimental_providerMetadata;

  if (
    typeof cleanMessage.id === "string" &&
    (cleanMessage.id.startsWith("msg_") ||
      cleanMessage.id.startsWith("rs_") ||
      cleanMessage.id.startsWith("fc_"))
  ) {
    delete cleanMessage.id;
  }

  return cleanMessage as unknown as TMessage;
}

function estimateSerializedSize(value: unknown) {
  try {
    return JSON.stringify(value).length;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

function alignMessagesToTurnBoundary<TMessage extends AnyUIMessage>(messages: TMessage[]) {
  if (messages.length <= 1 || messages[0]?.role === "user") {
    return messages;
  }

  const firstUserIndex = messages.findIndex((message) => message.role === "user");
  return firstUserIndex === -1 ? messages : messages.slice(firstUserIndex);
}

export function compactConversationMessages<TMessage extends AnyUIMessage>(
  messages: TMessage[],
  options: ConversationCompactionOptions,
): TMessage[] {
  const normalizedMessages = messages.flatMap((message) => {
    const compactedMessage = compactMessage(message, options);
    return compactedMessage ? [compactedMessage] : [];
  });

  if (normalizedMessages.length === 0) {
    return normalizedMessages;
  }

  const compactedMessages: TMessage[] = [];
  let totalChars = 0;

  for (let index = normalizedMessages.length - 1; index >= 0; index--) {
    const message = normalizedMessages[index]!;
    const messageSize = estimateSerializedSize(message);

    if (
      compactedMessages.length > 0 &&
      (compactedMessages.length >= options.maxMessages ||
        totalChars + messageSize > options.maxTotalChars)
    ) {
      break;
    }

    compactedMessages.unshift(message);
    totalChars += messageSize;
  }

  return alignMessagesToTurnBoundary(compactedMessages);
}

export function compactConversationForModel<TMessage extends AnyUIMessage>(messages: TMessage[]) {
  return compactConversationMessages(messages, MODEL_CONTEXT_COMPACTION_OPTIONS);
}

export function compactConversationForSession<TMessage extends AnyUIMessage>(messages: TMessage[]) {
  return compactConversationMessages(messages, SESSION_HISTORY_COMPACTION_OPTIONS);
}