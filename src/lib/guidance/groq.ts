import "server-only";
import Groq from "groq-sdk";
import { z } from "zod";
import type { AiConfig } from "./config";
import type { ModelOutcome } from "./pipeline";

let client: Groq | null = null;

/**
 * Groq's strict structured outputs require every property to be listed in
 * `required` and `additionalProperties: false` on every object.
 */
function strictSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(strictSchema);
  if (!node || typeof node !== "object") return node;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node)) if (k !== "$schema") out[k] = strictSchema(v);
  if (out.type === "object" && out.properties && typeof out.properties === "object") {
    out.required = Object.keys(out.properties);
    out.additionalProperties = false;
  }
  return out;
}

/**
 * Calls a Groq-hosted model with a strict JSON schema. Request text is never
 * logged; only outcome categories and token counts leave this function.
 * A 429 (free-plan limit reached) is reported as "quota".
 */
export async function callGroq(cfg: AiConfig, system: string, user: string, schema: z.ZodType): Promise<ModelOutcome> {
  client ??= new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: cfg.timeoutMs, maxRetries: cfg.maxRetries });
  try {
    const res = await client.chat.completions.create({
      model: cfg.model,
      max_completion_tokens: cfg.maxOutputTokens,
      reasoning_effort: cfg.effort,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "abide_response", strict: true, schema: strictSchema(z.toJSONSchema(schema)) as Record<string, unknown> },
      },
    });
    const usage = { inputTokens: res.usage?.prompt_tokens ?? 0, outputTokens: res.usage?.completion_tokens ?? 0 };
    const choice = res.choices[0];
    if (!choice?.message?.content || choice.finish_reason === "length") return { status: "malformed", ...usage };
    let output: unknown;
    try {
      output = JSON.parse(choice.message.content);
    } catch {
      return { status: "malformed", ...usage };
    }
    const parsed = schema.safeParse(output);
    if (!parsed.success) return { status: "malformed", ...usage };
    return { status: "ok", output: parsed.data, model: res.model, ...usage };
  } catch (e) {
    if (e instanceof Groq.RateLimitError) return { status: "quota" };
    if (e instanceof Groq.APIConnectionTimeoutError) return { status: "timeout" };
    if (e instanceof Groq.APIError) {
      console.error("ai: groq error", { status: e.status });
      return { status: "error" };
    }
    console.error("ai: unexpected groq failure", { name: (e as Error)?.name });
    return { status: "error" };
  }
}
