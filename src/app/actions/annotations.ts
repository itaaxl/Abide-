"use server";

import { z } from "zod";
import { HIGHLIGHT_COLORS, NOTE_MAX, type ActionResult } from "@/lib/annotations";
import { validPassage, withUser } from "@/lib/actions-util";

const passage = z.object({
  edition: z.string().max(40),
  book: z.string().regex(/^[A-Z0-9]{3}$/),
  chapter: z.number().int().positive().max(200),
  verseStart: z.number().int().positive().max(200),
  verseEnd: z.number().int().positive().max(200),
});

export async function toggleBookmark(input: z.infer<typeof passage>): Promise<ActionResult<{ id: string } | undefined>> {
  const p = passage.safeParse(input);
  if (!p.success) return { ok: false, error: "Invalid passage." };
  const v = p.data;
  if (!(await validPassage(v.edition, v.book, v.chapter, v.verseStart, v.verseEnd)))
    return { ok: false, error: "That passage is not in this edition." };
  return withUser(async ({ supabase, user }) => {
    const match = supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("edition", v.edition)
      .eq("book", v.book)
      .eq("chapter", v.chapter)
      .eq("verse_start", v.verseStart)
      .eq("verse_end", v.verseEnd);
    const { data: existing } = await match.maybeSingle();
    if (existing) {
      const { error } = await supabase.from("bookmarks").delete().eq("id", existing.id);
      return error ? { ok: false, error: "Could not remove bookmark." } : { ok: true };
    }
    const { data, error } = await supabase
      .from("bookmarks")
      .upsert(
        { user_id: user.id, edition: v.edition, book: v.book, chapter: v.chapter, verse_start: v.verseStart, verse_end: v.verseEnd },
        { onConflict: "user_id,edition,book,chapter,verse_start,verse_end" },
      )
      .select("id")
      .single();
    return error ? { ok: false, error: "Could not save bookmark." } : { ok: true, data: { id: data.id } };
  });
}

export async function setBookmarkTags(id: string, tags: string[]): Promise<ActionResult> {
  const parsed = z.array(z.string().trim().min(1).max(30)).max(10).safeParse(tags);
  if (!z.string().uuid().safeParse(id).success || !parsed.success) return { ok: false, error: "Invalid tags." };
  return withUser(async ({ supabase }) => {
    const { error } = await supabase.from("bookmarks").update({ tags: [...new Set(parsed.data)] }).eq("id", id);
    return error ? { ok: false, error: "Could not update tags." } : { ok: true };
  });
}

export async function deleteBookmark(id: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid id." };
  return withUser(async ({ supabase }) => {
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);
    return error ? { ok: false, error: "Could not delete." } : { ok: true };
  });
}

const highlightInput = z.object({
  edition: z.string().max(40),
  book: z.string().regex(/^[A-Z0-9]{3}$/),
  chapter: z.number().int().positive().max(200),
  verses: z.array(z.number().int().positive().max(200)).min(1).max(200),
  color: z.enum(HIGHLIGHT_COLORS).nullable(),
});

export async function setHighlight(input: z.infer<typeof highlightInput>): Promise<ActionResult> {
  const p = highlightInput.safeParse(input);
  if (!p.success) return { ok: false, error: "Invalid highlight." };
  const v = p.data;
  if (!(await validPassage(v.edition, v.book, v.chapter, Math.min(...v.verses), Math.max(...v.verses))))
    return { ok: false, error: "That passage is not in this edition." };
  return withUser(async ({ supabase, user }) => {
    if (v.color === null) {
      const { error } = await supabase
        .from("highlights")
        .delete()
        .eq("edition", v.edition)
        .eq("book", v.book)
        .eq("chapter", v.chapter)
        .in("verse", v.verses);
      return error ? { ok: false, error: "Could not clear highlight." } : { ok: true };
    }
    const rows = v.verses.map((verse) => ({
      user_id: user.id,
      edition: v.edition,
      book: v.book,
      chapter: v.chapter,
      verse,
      color: v.color!,
    }));
    const { error } = await supabase.from("highlights").upsert(rows, { onConflict: "user_id,edition,book,chapter,verse" });
    return error ? { ok: false, error: "Could not save highlight." } : { ok: true };
  });
}

const noteInput = passage.extend({
  id: z.string().uuid().optional(),
  body: z.string().trim().min(1).max(NOTE_MAX),
});

export async function saveNote(input: z.infer<typeof noteInput>): Promise<ActionResult<{ id: string }>> {
  const p = noteInput.safeParse(input);
  if (!p.success) return { ok: false, error: `Notes must be 1–${NOTE_MAX} characters.` };
  const v = p.data;
  if (!(await validPassage(v.edition, v.book, v.chapter, v.verseStart, v.verseEnd)))
    return { ok: false, error: "That passage is not in this edition." };
  return withUser(async ({ supabase, user }) => {
    if (v.id) {
      const { data, error } = await supabase
        .from("notes")
        .update({ body: v.body, updated_at: new Date().toISOString() })
        .eq("id", v.id)
        .select("id")
        .single();
      return error ? { ok: false, error: "Could not update note." } : { ok: true, data: { id: data.id } };
    }
    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        edition: v.edition,
        book: v.book,
        chapter: v.chapter,
        verse_start: v.verseStart,
        verse_end: v.verseEnd,
        body: v.body,
      })
      .select("id")
      .single();
    return error ? { ok: false, error: "Could not save note." } : { ok: true, data: { id: data.id } };
  });
}

export async function deleteNote(id: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid id." };
  return withUser(async ({ supabase }) => {
    const { error } = await supabase.from("notes").delete().eq("id", id);
    return error ? { ok: false, error: "Could not delete note." } : { ok: true };
  });
}

/** Save the last reading location: one row per user, upserted at most once per chapter view. */
export async function saveReadingPosition(edition: string, book: string, chapter: number): Promise<ActionResult> {
  if (!(await validPassage(edition, book, chapter, 1, 1))) return { ok: false, error: "Invalid passage." };
  return withUser(async ({ supabase, user }) => {
    const now = new Date().toISOString();
    await supabase.from("reading_positions").upsert({ user_id: user.id, edition, book, chapter, updated_at: now });
    await supabase
      .from("reading_history")
      .upsert({ user_id: user.id, edition, book, chapter }, { onConflict: "user_id,edition,book,chapter,read_on", ignoreDuplicates: true });
    return { ok: true };
  });
}
