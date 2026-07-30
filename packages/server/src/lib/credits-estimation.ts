import type { ModelMessage } from "ai";
import type { LanguageModelUsage } from "ai";

// Rough, deliberately conservative heuristic for when a provider doesn't
// return exact usage (e.g. the stream was aborted before the final
// usage-bearing chunk arrived). ~4 chars/token is a commonly-cited average
// for English text across most tokenizers - not exact, but far better than
// charging nothing at all for real provider spend that already happened.
const ESTIMATED_CHARS_PER_TOKEN = 4;

function estimateTokensFromChars(charCount: number): number {
  return Math.max(0, Math.ceil(charCount / ESTIMATED_CHARS_PER_TOKEN));
}

function extractTextLength(parts: unknown): number {
  if (typeof parts === "string") return parts.length;

  if (Array.isArray(parts)) {
    return parts.reduce((sum: number, part) => {
      if (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string") {
        return sum + (part as { text: string }).text.length;
      }
      return sum;
    }, 0);
  }

  return 0;
}

/**
 * Best-effort usage reconstruction for a request interrupted before the
 * provider returned final usage totals. Deliberately only counts visible
 * "text" parts toward output - reasoning content, tool-call payloads, etc.
 * are excluded, so this skews conservative (undercounts) rather than
 * overcounts on ambiguous content.
 */
export function estimatePartialUsage({
  modelMessages,
  responseMessageParts,
}: {
  modelMessages: ModelMessage[];
  responseMessageParts: unknown[];
}): LanguageModelUsage {
  const inputChars = modelMessages.reduce(
    (sum, message) => sum + extractTextLength((message as { content: unknown }).content),
    0,
  );

  const textPartsOnly = Array.isArray(responseMessageParts)
    ? responseMessageParts.filter((part) => part && typeof part === "object" && (part as { type?: string }).type === "text")
    : [];
  const outputChars = extractTextLength(textPartsOnly);

  const inputTokens = estimateTokensFromChars(inputChars);
  const outputTokens = estimateTokensFromChars(outputChars);

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
  } as LanguageModelUsage;
}

export function resolveUsageForBilling(
  completedUsage: LanguageModelUsage | null,
  fallback: { modelMessages: ModelMessage[]; responseMessageParts: unknown[] },
): { usage: LanguageModelUsage; isEstimated: boolean } {
  if (completedUsage) {
    return { usage: completedUsage, isEstimated: false };
  }

  return { usage: estimatePartialUsage(fallback), isEstimated: true };
}