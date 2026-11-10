import "server-only";
import type { z } from "zod";
import { consume } from "../rate-limit";
import { callAnthropic } from "./anthropic";
import type { AiConfig } from "./config";
import { callGroq } from "./groq";
import type { ModelOutcome } from "./pipeline";

/**
 * Single entry point for AI calls. Enforces site-wide caps (kept below the
 * provider's free-plan limits) before any request leaves the server; when a
 * cap is reached the caller shows the curated fallback. Never switches to
 * another (paid) provider.
 */
export async function callModel(cfg: AiConfig, system: string, user: string, schema: z.ZodType): Promise<ModelOutcome> {
  if (!(await consume("ai:global:minute", cfg.globalPerMinuteLimit, 60))) return { status: "quota" };
  if (!(await consume("ai:global:day", cfg.globalDailyLimit, 86400))) return { status: "quota" };
  return cfg.provider === "groq" ? callGroq(cfg, system, user, schema) : callAnthropic(cfg, system, user, schema);
}
