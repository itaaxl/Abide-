"use server";

import { z } from "zod";
import { site } from "@/config/site";
import { AuthError, requireVerifiedUser } from "@/lib/auth";
import { authErrorMessage } from "@/lib/actions-util";
import type { ActionResult } from "@/lib/annotations";
import { mapReference } from "@/lib/bible/mapping";
import { getEdition, getVerses } from "@/lib/bible/provider";
import { searchBible } from "@/lib/bible/search";
import { getTopics } from "@/lib/content";
import { callModel } from "@/lib/guidance/provider";
import { guidanceOutputSchema } from "@/lib/guidance/schema";
import { aiConfig } from "@/lib/guidance/config";
import { runGuidance, type ModelOutcome } from "@/lib/guidance/pipeline";
import type { GuidanceResult } from "@/lib/guidance/schema";
import { consume } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/server";
import { localDate } from "@/lib/time";

const TONES = ["gentle", "encouraging", "reflective", "practical"] as const;

export async function requestGuidance(input: { text: string; topic?: string; tone?: string; edition?: string }): Promise<ActionResult<GuidanceResult>> {
  const cfg = aiConfig();
  const parsed = z
    .object({
      text: z.string().trim().min(3, "Please write a few words.").max(cfg.maxInputChars, `Please keep it under ${cfg.maxInputChars} characters.`),
      topic: z.string().max(40).optional(),
      tone: z.enum(TONES).optional(),
      edition: z.string().max(40).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const v = parsed.data;

  let userId: string;
  try {
    userId = (await requireVerifiedUser()).user.id;
  } catch (e) {
    return { ok: false, error: e instanceof AuthError ? authErrorMessage(e) : "Please sign in." };
  }
  // Burst protection (durable when the service key is configured).
  if (!(await consume(`guidance:${userId}`, cfg.perMinuteLimit, 60)))
    return { ok: false, error: "Please wait a minute before sending another request." };

  const edition = (v.edition && (await getEdition(v.edition))) || (await getEdition(site.defaultEdition))!;
  const admin = createAdminClient();
  const day = localDate(new Date(), "UTC");
  // AI only runs when usage can be metered durably and the edition permits AI processing.
  const aiAvailable = cfg.enabled && Boolean(admin) && edition.license.aiProcessingAllowed;

  const result = await runGuidance(
    { text: v.text, topic: v.topic, tone: v.tone },
    {
      topics: await getTopics(),
      edition,
      search: (q) => searchBible(edition.id, q, { pageSize: 5 }),
      // Candidate refs use WEB numbering; keep only those whose numbering is identical in this edition.
      verses: async (ed, ref) => {
        if ((await mapReference(ref, site.defaultEdition, ed)).status !== "same") return null;
        return getVerses(ed, ref.book, ref.chapter, ref.verse, ref.endVerse ?? ref.verse);
      },
      aiAvailable,
      reserve: async () => {
        const { data, error } = await admin!.rpc("reserve_ai_request", { p_user: userId, p_day: day, p_limit: cfg.dailyLimit });
        if (error || data === -1) return null;
        return cfg.dailyLimit - Number(data);
      },
      callModel: (system, user) => callModel(cfg, system, user, guidanceOutputSchema),
      recordResult: async (o: ModelOutcome) => {
        await admin!.rpc("record_ai_result", {
          p_user: userId,
          p_day: day,
          p_in: o.inputTokens ?? 0,
          p_out: o.outputTokens ?? 0,
          p_failed: o.status !== "ok",
        });
      },
    },
  );
  return { ok: true, data: result };
}

const saveSchema = z.object({
  text: z.string().trim().min(1).max(1000),
  topic: z.string().max(40).optional(),
  edition: z.string().max(40),
  result: z.object({
    kind: z.enum(["ai", "fallback"]),
    opening: z.string().max(600).optional(),
    passages: z.array(z.object({ key: z.string().max(30), label: z.string().max(80), connection: z.string().max(800) })).max(6),
    practicalSteps: z.array(z.string().max(300)).max(3),
    prayer: z.string().max(800).optional(),
  }),
});

/** Explicit, optional save. Only runs when the person presses “Save this guidance”. */
export async function saveGuidance(input: z.infer<typeof saveSchema>): Promise<ActionResult<{ id: string }>> {
  const p = saveSchema.safeParse(input);
  if (!p.success) return { ok: false, error: "Could not save this guidance." };
  try {
    const { supabase, user } = await requireVerifiedUser();
    const { data, error } = await supabase
      .from("saved_guidance")
      .insert({ user_id: user.id, request_text: p.data.text, topic: p.data.topic ?? null, edition: p.data.edition, response: p.data.result })
      .select("id")
      .single();
    return error ? { ok: false, error: "Could not save." } : { ok: true, data: { id: data.id } };
  } catch (e) {
    return { ok: false, error: authErrorMessage(e) };
  }
}

export async function deleteSavedGuidance(id: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid id." };
  try {
    const { supabase } = await requireVerifiedUser();
    const { error } = await supabase.from("saved_guidance").delete().eq("id", id);
    return error ? { ok: false, error: "Could not delete." } : { ok: true };
  } catch (e) {
    return { ok: false, error: authErrorMessage(e) };
  }
}
