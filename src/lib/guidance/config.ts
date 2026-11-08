import "server-only";

/** AI configuration. Every limit is bounded and configurable; keys stay server-side. */
function int(name: string, fallback: number, min: number, max: number) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
}

export function aiConfig() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  return {
    provider: (process.env.AI_PROVIDER ?? "anthropic") as "anthropic",
    enabled: Boolean(apiKey) && process.env.AI_ENABLED !== "false",
    model: process.env.AI_MODEL || "claude-opus-5-5",
    effort: (["low", "medium", "high"].includes(process.env.AI_EFFORT ?? "") ? process.env.AI_EFFORT : "medium") as "low" | "medium" | "high",
    maxOutputTokens: int("AI_MAX_OUTPUT_TOKENS", 4000, 1000, 16000),
    timeoutMs: int("AI_TIMEOUT_MS", 60000, 5000, 120000),
    maxRetries: int("AI_MAX_RETRIES", 1, 0, 3),
    dailyLimit: int("AI_DAILY_LIMIT_PER_USER", 10, 1, 200),
    perMinuteLimit: int("AI_PER_MINUTE_LIMIT_PER_USER", 3, 1, 30),
    maxInputChars: int("AI_MAX_INPUT_CHARS", 1000, 100, 4000),
    /** Server-side refusal fallback ("default" routing). Set AI_FALLBACKS=off to disable. */
    fallbacks: process.env.AI_FALLBACKS !== "off",
  };
}

export type AiConfig = ReturnType<typeof aiConfig>;
