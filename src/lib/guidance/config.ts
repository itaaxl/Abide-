import "server-only";

/** AI configuration. Every limit is bounded and configurable; keys stay server-side. */
function int(name: string, fallback: number, min: number, max: number) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
}

export type AiProvider = "groq" | "anthropic";

/**
 * The provider is chosen explicitly (AI_PROVIDER, default "groq") and never
 * switches automatically: if the chosen provider has no key, AI is off and
 * the curated fallback is shown.
 */
export function aiConfig() {
  const provider: AiProvider = process.env.AI_PROVIDER === "anthropic" ? "anthropic" : "groq";
  const apiKey = provider === "groq" ? process.env.GROQ_API_KEY : process.env.ANTHROPIC_API_KEY;
  const defaultModel = provider === "groq" ? "openai/gpt-oss-20b" : "claude-opus-5-5";
  return {
    provider,
    enabled: Boolean(apiKey) && process.env.AI_ENABLED !== "false",
    model: process.env.AI_MODEL || defaultModel,
    effort: (["low", "medium", "high"].includes(process.env.AI_EFFORT ?? "") ? process.env.AI_EFFORT : "low") as "low" | "medium" | "high",
    maxOutputTokens: int("AI_MAX_OUTPUT_TOKENS", 4000, 1000, 16000),
    timeoutMs: int("AI_TIMEOUT_MS", 60000, 5000, 120000),
    maxRetries: int("AI_MAX_RETRIES", 1, 0, 3),
    dailyLimit: int("AI_DAILY_LIMIT_PER_USER", 10, 1, 200),
    perMinuteLimit: int("AI_PER_MINUTE_LIMIT_PER_USER", 3, 1, 30),
    /** Site-wide caps, kept below the provider's free-plan limits. */
    globalDailyLimit: int("AI_GLOBAL_DAILY_LIMIT", 300, 1, 100000),
    globalPerMinuteLimit: int("AI_GLOBAL_PER_MINUTE_LIMIT", 20, 1, 1000),
    maxInputChars: int("AI_MAX_INPUT_CHARS", 1000, 100, 4000),
    /** Server-side refusal fallback (Anthropic only). Set AI_FALLBACKS=off to disable. */
    fallbacks: process.env.AI_FALLBACKS !== "off",
  };
}

export type AiConfig = ReturnType<typeof aiConfig>;
