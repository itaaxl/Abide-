"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/annotations";
import { validPassage, withUser } from "@/lib/actions-util";
import { RATINGS, schedule } from "@/lib/srs";
import { safeTimezone } from "@/lib/time";
import type { SupabaseClient } from "@supabase/supabase-js";

const KINDS = ["ref_to_text", "text_to_ref", "cloze"] as const;

async function defaultDeck(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const name = "My verses";
  const { data } = await supabase.from("decks").select("id").eq("user_id", userId).eq("name", name).maybeSingle();
  if (data) return data.id;
  const { data: created, error } = await supabase
    .from("decks")
    .upsert({ user_id: userId, name, description: "Verses saved from the reader and daily verse." }, { onConflict: "user_id,name" })
    .select("id")
    .single();
  return error ? null : created.id;
}

const passageCard = z.object({
  edition: z.string().max(40),
  book: z.string().regex(/^[A-Z0-9]{3}$/),
  chapter: z.number().int().positive().max(200),
  verseStart: z.number().int().positive().max(200),
  verseEnd: z.number().int().positive().max(200),
  kind: z.enum(KINDS).optional(),
  deckId: z.string().uuid().optional(),
});

export async function addPassageCard(input: z.infer<typeof passageCard>): Promise<ActionResult<{ id: string }>> {
  const p = passageCard.safeParse(input);
  if (!p.success) return { ok: false, error: "Invalid passage." };
  const v = p.data;
  if (v.verseEnd - v.verseStart > 9) return { ok: false, error: "Choose up to 10 verses per card." };
  if (!(await validPassage(v.edition, v.book, v.chapter, v.verseStart, v.verseEnd)))
    return { ok: false, error: "That passage is not in this edition." };
  return withUser(async ({ supabase, user }) => {
    const deckId = v.deckId ?? (await defaultDeck(supabase, user.id));
    if (!deckId) return { ok: false, error: "Could not create a deck." };
    const { data, error } = await supabase
      .from("cards")
      .insert({
        user_id: user.id,
        deck_id: deckId,
        kind: v.kind ?? "ref_to_text",
        edition: v.edition,
        book: v.book,
        chapter: v.chapter,
        verse_start: v.verseStart,
        verse_end: v.verseEnd,
      })
      .select("id")
      .single();
    if (error?.code === "23505") return { ok: false, error: "This passage is already in that deck." };
    if (error) return { ok: false, error: "Could not create the flashcard." };
    revalidatePath("/flashcards");
    return { ok: true, data: { id: data.id } };
  });
}

export async function addPassageCardForm(formData: FormData) {
  await addPassageCard({
    edition: String(formData.get("edition")),
    book: String(formData.get("book")),
    chapter: Number(formData.get("chapter")),
    verseStart: Number(formData.get("verseStart")),
    verseEnd: Number(formData.get("verseEnd")),
    kind: (formData.get("kind") as (typeof KINDS)[number]) || undefined,
    deckId: (formData.get("deckId") as string) || undefined,
  });
}

export async function addCustomCard(deckId: string, front: string, back: string): Promise<ActionResult> {
  const p = z
    .object({ deckId: z.string().uuid(), front: z.string().trim().min(1).max(1000), back: z.string().trim().min(1).max(2000) })
    .safeParse({ deckId, front, back });
  if (!p.success) return { ok: false, error: "Question and answer are required (max 1000/2000 characters)." };
  return withUser(async ({ supabase, user }) => {
    const { error } = await supabase
      .from("cards")
      .insert({ user_id: user.id, deck_id: p.data.deckId, kind: "custom", front: p.data.front, back: p.data.back });
    if (error) return { ok: false, error: "Could not create the card." };
    revalidatePath(`/flashcards/decks/${deckId}`);
    return { ok: true };
  });
}

export async function createDeck(name: string, description = ""): Promise<ActionResult<{ id: string }>> {
  const p = z.object({ name: z.string().trim().min(1).max(80), description: z.string().max(500) }).safeParse({ name, description });
  if (!p.success) return { ok: false, error: "Deck names must be 1–80 characters." };
  return withUser(async ({ supabase, user }) => {
    const { data, error } = await supabase
      .from("decks")
      .insert({ user_id: user.id, name: p.data.name, description: p.data.description || null })
      .select("id")
      .single();
    if (error?.code === "23505") return { ok: false, error: "You already have a deck with that name." };
    if (error) return { ok: false, error: "Could not create the deck." };
    revalidatePath("/flashcards");
    return { ok: true, data: { id: data.id } };
  });
}

export async function updateDeck(id: string, name: string, description: string): Promise<ActionResult> {
  const p = z
    .object({ id: z.string().uuid(), name: z.string().trim().min(1).max(80), description: z.string().max(500) })
    .safeParse({ id, name, description });
  if (!p.success) return { ok: false, error: "Invalid deck details." };
  return withUser(async ({ supabase }) => {
    const { error } = await supabase
      .from("decks")
      .update({ name: p.data.name, description: p.data.description || null, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { ok: false, error: error.code === "23505" ? "Name already used." : "Could not update." };
    revalidatePath("/flashcards");
    return { ok: true };
  });
}

export async function deleteDeck(id: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid id." };
  return withUser(async ({ supabase }) => {
    const { error } = await supabase.from("decks").delete().eq("id", id);
    if (error) return { ok: false, error: "Could not delete." };
    revalidatePath("/flashcards");
    return { ok: true };
  });
}

/** Reset scheduling for every card in a deck. Review history is removed too. */
export async function resetDeck(id: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid id." };
  return withUser(async ({ supabase }) => {
    const { data: cards } = await supabase.from("cards").select("id, version").eq("deck_id", id);
    const ids = (cards ?? []).map((c) => c.id);
    if (ids.length) {
      await supabase.from("reviews").delete().in("card_id", ids);
      for (const c of cards ?? []) {
        await supabase
          .from("cards")
          .update({ interval_days: 0, ease: 2.5, reps: 0, lapses: 0, due_at: new Date().toISOString(), last_reviewed_at: null, version: c.version + 1 })
          .eq("id", c.id);
      }
    }
    revalidatePath(`/flashcards/decks/${id}`);
    return { ok: true };
  });
}

export async function deleteCard(id: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid id." };
  return withUser(async ({ supabase }) => {
    const { error } = await supabase.from("cards").delete().eq("id", id);
    return error ? { ok: false, error: "Could not delete." } : { ok: true };
  });
}

/** Explicitly copy a passage card into another edition (original is kept). */
export async function duplicateCardToEdition(cardId: string, edition: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(cardId).success) return { ok: false, error: "Invalid id." };
  return withUser(async ({ supabase, user }) => {
    const { data: c } = await supabase.from("cards").select("*").eq("id", cardId).single();
    if (!c || c.kind === "custom") return { ok: false, error: "Only Scripture cards can be copied to another translation." };
    if (!(await validPassage(edition, c.book, c.chapter, c.verse_start, c.verse_end)))
      return { ok: false, error: "That passage does not exist with the same numbering in the chosen translation." };
    const { error } = await supabase.from("cards").insert({
      user_id: user.id,
      deck_id: c.deck_id,
      kind: c.kind,
      edition,
      book: c.book,
      chapter: c.chapter,
      verse_start: c.verse_start,
      verse_end: c.verse_end,
    });
    if (error?.code === "23505") return { ok: false, error: "That version is already in the deck." };
    return error ? { ok: false, error: "Could not copy the card." } : { ok: true };
  });
}

const reviewInput = z.object({
  cardId: z.string().uuid(),
  requestId: z.string().uuid(),
  rating: z.enum(RATINGS),
  expectedVersion: z.number().int().min(0),
});

export type ReviewData = { status: "ok" | "duplicate" | "conflict"; dueAt?: string; version?: number };
export type ReviewResult = ActionResult<ReviewData>;

/**
 * Record a review. The client generates requestId once per answer, so retries
 * and rapid double-taps are idempotent; expectedVersion rejects stale updates
 * from another device.
 */
export async function reviewCard(input: z.infer<typeof reviewInput>): Promise<ReviewResult> {
  const p = reviewInput.safeParse(input);
  if (!p.success) return { ok: false, error: "Invalid review." };
  const v = p.data;
  return withUser<ReviewData>(async ({ supabase, user }) => {
    const { data: card } = await supabase
      .from("cards")
      .select("interval_days, ease, reps, lapses, version")
      .eq("id", v.cardId)
      .maybeSingle();
    if (!card) return { ok: false, error: "Card not found." };
    const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).maybeSingle();
    const next = schedule(
      { intervalDays: card.interval_days, ease: card.ease, reps: card.reps, lapses: card.lapses },
      v.rating,
      new Date(),
      safeTimezone(profile?.timezone),
    );
    const { data, error } = await supabase.rpc("record_review", {
      p_card_id: v.cardId,
      p_request_id: v.requestId,
      p_rating: v.rating,
      p_expected_version: v.expectedVersion,
      p_interval: next.intervalDays,
      p_ease: next.ease,
      p_reps: next.reps,
      p_lapses: next.lapses,
      p_due_at: next.dueAt.toISOString(),
    });
    if (error) return { ok: false, error: "Could not save your review. The card stays in your queue." };
    const status = (data as { status: string }).status;
    if (status === "not_found") return { ok: false, error: "Card not found." };
    if (status === "conflict")
      return { ok: true, data: { status: "conflict", version: (data as { version: number }).version } };
    return {
      ok: true,
      data: { status: status as "ok" | "duplicate", dueAt: next.dueAt.toISOString(), version: (data as { version?: number }).version },
    };
  });
}

export async function setDailyTarget(target: number): Promise<ActionResult> {
  if (!Number.isInteger(target) || target < 1 || target > 200) return { ok: false, error: "Choose 1–200." };
  return withUser(async ({ supabase, user }) => {
    const { error } = await supabase.from("profiles").update({ daily_review_target: target }).eq("id", user.id);
    return error ? { ok: false, error: "Could not save." } : { ok: true };
  });
}
