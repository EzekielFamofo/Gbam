import type { NormalizedTokenUsage } from '../types/tokens';

export function parseTokenUsage(payload: any): NormalizedTokenUsage {
  if (!payload || typeof payload !== 'object') {
    return createEmptyUsage();
  }

  // 1. Check for Gemini usageMetadata structure
  const geminiUsage = payload.usageMetadata || payload.usage_metadata;
  if (geminiUsage) {
    const prompt = geminiUsage.promptTokenCount ?? geminiUsage.prompt_token_count ?? 0;
    const candidates = geminiUsage.candidatesTokenCount ?? geminiUsage.candidates_token_count ?? 0;
    const thoughts = geminiUsage.thoughtsTokenCount ?? geminiUsage.thoughts_token_count ?? 0;
    const cached = geminiUsage.cachedContentTokenCount ?? geminiUsage.cached_content_token_count ?? 0;
    const total = geminiUsage.totalTokenCount ?? geminiUsage.total_token_count ?? (prompt + candidates + thoughts);

    return {
      promptTokens: prompt,
      completionTokens: candidates,
      reasoningTokens: thoughts,
      cachedTokens: cached,
      totalTokens: total,
      provider: 'gemini',
    };
  }

  // 2. Check for OpenAI usage structure
  if (payload.usage) {
    const u = payload.usage;
    const prompt = u.prompt_tokens ?? 0;
    const completion = u.completion_tokens ?? 0;
    const reasoning = u.completion_tokens_details?.reasoning_tokens ?? 0;
    const cached = u.prompt_tokens_details?.cached_tokens ?? 0;
    const total = u.total_tokens ?? (prompt + completion);

    return {
      promptTokens: prompt,
      completionTokens: completion,
      reasoningTokens: reasoning,
      cachedTokens: cached,
      totalTokens: total,
      provider: 'openai',
    };
  }

  // 3. Fallback for unparsed or unknown providers
  return createEmptyUsage();
}

function createEmptyUsage(): NormalizedTokenUsage {
  return {
    promptTokens: 0,
    completionTokens: 0,
    reasoningTokens: 0,
    cachedTokens: 0,
    totalTokens: 0,
    provider: 'unknown',
  };
}