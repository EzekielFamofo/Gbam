export interface NormalizedTokenUsage {
  promptTokens: number;
  completionTokens: number; // Candidate/output tokens
  reasoningTokens: number;  // OpenAI reasoning or Gemini thoughts_token_count
  cachedTokens: number;     // Prompt caching
  totalTokens: number;
  provider: 'openai' | 'gemini' | 'anthropic' | 'unknown';
}

export interface RequestLogEntry {
  id: string;
  timestamp: Date;
  provider: string;
  model: string;
  usage: NormalizedTokenUsage;
  latencyMs: number;
}