"use server";

import { z } from "zod";
import { site } from "@/config/site";
import { authErrorMessage } from "@/lib/actions-util";
import type { ActionResult } from "@/lib/annotations";
import { AuthError, requireVerifiedUser } from "@/lib/auth";
import { getEdition } from "@/lib/bible/provider";
import {
  buildCardsMessage,
  cacheKey,
  cardCandidates,
  CARDS_SYSTEM_PROMPT,
  cardsOutputSchema,
  describeRequest,
  fromCached,
  toCached,
  toCards,
  type CachedSelection,
  type CardsInput,
  type GeneratedCard,
} from "@/lib/flashcards-ai";
import { callAnthropic } from "@/lib/guidance/anthropic";
import { aiConfig } from "@/lib/guidance/config";
import { detectCrisis } from "@/lib/guidance/safety";
import { consume } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/server";
import { localDate } from "@/lib/time";

export type GenerateCardsResult =
  | { kind: "cards"; cards: GeneratedCard[]; cached: boolean; remainingToday?: number }
  | { kind: "clarify"; question: string }
  | { kind: "support" };

const inputSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("topic"), topic: z.string().trim().min(2, "Choose a topic.").max(60) }),
  z.object({ mode: z.literal("chapter"), book: z.string().regex(/^[1-3A-Z]{3}$/, "Choose a book."), chapter: z.number().int().min(1).max(150) }),
  z.object({ mode: z.literal("goal"), text: z.string().trim().min(3, "Please write a few words.").max(300, "Please keep it under 300 characters.") }),
]);

/**
 * Generate 3–5 flashcards with AI. The model only chooses among passages taken
 * from the verified Bible dataset and writes a short reflection; the verse text
 * itself is always read from the dataset. Nothing is saved here — the person
 * saves the cards they choose. Results are cached and reused to control cost.
 */
export async function generateCards(raw: CardsInput & { edition?: string }): Promise<ActionResult<GenerateCardsResult>> {
  const cfg = aiConfig();
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const input = parsed.data as CardsInput;

  let userId: string;
  try {
    userId = (await requireVerifiedUser()).user.id;
  } catch (e) {
    return { ok: false, error: e instanceof AuthError ? authErrorMessage(e) : "Please sign in." };
  }

  if (input.mode === "goal" && detectCrisis(input.text)) return { ok: true, data: { kind: "support" } };

  const edition = (raw.edition && (await getEdition(raw.edition))) || (await getEdition(site.defaultEdition))!;
  const admin = createAdminClient();
  if (!cfg.enabled || !admin || !edition.license.aiProcessingAllowed)
    return { ok: false, error: "AI card generation isn’t available on this site right now." };

  // 1) Reuse an earlier result for the same request (no AI cost, no quota used).
  const key = cacheKey(input, edition.id, cfg.model, userId);
  const { data: hit } = await admin.from("ai_card_cache").select("result").eq("cache_key", key).maybeSingle();
  if (hit?.result) {
    const cards = await fromCached(hit.result as CachedSelection, edition);
    if (cards.length >= 3) return { ok: true, data: { kind: "cards", cards, cached: true } };
  }

  // 2) Candidates from the dataset; ask for clarification if nothing fits.
  const candidates = await cardCandidates(input, edition);
  if (candidates.length < 3)
    return {
      ok: true,
      data: { kind: "clarify", question: "I couldn't find enough passages for that. Could you describe it differently, or try a topic or a chapter?" },
    };

  // 3) Limits: a per-minute burst limit and the shared daily AI allowance.
  if (!(await consume(`cards:${userId}`, cfg.perMinuteLimit, 60))) return { ok: false, error: "Please wait a minute before generating more cards." };
  const day = localDate(new Date(), "UTC");
  const { data: used, error: qErr } = await admin.rpc("reserve_ai_request", { p_user: userId, p_day: day, p_limit: cfg.dailyLimit });
  if (qErr || used === -1) return { ok: false, error: "You’ve reached today’s limit for AI requests. Please try again tomorrow." };
  const remainingToday = cfg.dailyLimit - Number(used);

  const outcome = await callAnthropic(cfg, CARDS_SYSTEM_PROMPT, buildCardsMessage(describeRequest(input, edition), candidates), cardsOutputSchema);
  await admin.rpc("record_ai_result", { p_user: userId, p_day: day, p_in: outcome.inputTokens ?? 0, p_out: outcome.outputTokens ?? 0, p_failed: outcome.status !== "ok" });
  if (outcome.status !== "ok") return { ok: false, error: "The AI service couldn’t create cards just now. Please try again later." };

  const out = cardsOutputSchema.safeParse(outcome.output);
  if (!out.success) return { ok: false, error: "The AI response couldn’t be verified, so nothing was shown." };
  if (out.data.needs_clarification)
    return { ok: true, data: { kind: "clarify", question: out.data.clarifying_question.slice(0, 300) || "Could you say a little more about what you'd like to memorize?" } };

  const cards = toCards(out.data.cards, candidates, edition);
  if (cards.length < 3) return { ok: false, error: "The AI response couldn’t be verified, so nothing was shown." };

  await admin.from("ai_card_cache").upsert({ cache_key: key, user_id: input.mode === "goal" ? userId : null, result: toCached(cards), model: outcome.model });
  return { ok: true, data: { kind: "cards", cards, cached: false, remainingToday } };
}
