import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { AiConfig } from "./config";
import type { ModelOutcome } from "./pipeline";
import { guidanceOutputSchema } from "./schema";

let client: Anthropic | null = null;

/**
 * Calls Claude with a strict JSON output schema. Request text is never logged;
 * only outcome categories and token counts leave this function.
 */
export async function callAnthropic(cfg: AiConfig, system: string, user: string): Promise<ModelOutcome> {
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: cfg.timeoutMs, maxRetries: cfg.maxRetries });
  try {
    const response = await client.beta.messages.parse({
      model: cfg.model,
      max_tokens: cfg.maxOutputTokens,
      system,
      messages: [{ role: "user", content: user }],
      output_config: { effort: cfg.effort, format: zodOutputFormat(guidanceOutputSchema) },
      // Server-side refusal fallback: if the primary model declines, the API
      // re-runs the request on an appropriate model. Disable with AI_FALLBACKS=off.
      ...(cfg.fallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
    });
    const usage = { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens };
    if (response.stop_reason === "refusal") return { status: "refusal", ...usage };
    if (response.stop_reason === "max_tokens" || !response.parsed_output) return { status: "malformed", ...usage };
    return { status: "ok", output: response.parsed_output, model: response.model, ...usage };
  } catch (e) {
    if (e instanceof Anthropic.APIConnectionTimeoutError) return { status: "timeout" };
    if (e instanceof Anthropic.APIError) {
      console.error("guidance: provider error", { status: e.status });
      return { status: "error" };
    }
    // JSON/schema parse failures from the SDK helper
    console.error("guidance: unexpected provider failure", { name: (e as Error)?.name });
    return { status: "malformed" };
  }
}
