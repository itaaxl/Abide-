import "server-only";
import { getSessionUser } from "./auth";
import type { ChapterAnnotations, HighlightColor } from "./annotations";
import { createClient } from "./supabase/server";

/** The signed-in user's annotations for one chapter of one edition, or null for guests. */
export async function getChapterAnnotations(edition: string, book: string, chapter: number): Promise<ChapterAnnotations | null> {
  const user = await getSessionUser();
  if (!user?.emailVerified) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const [b, h, n] = await Promise.all([
    supabase.from("bookmarks").select("id, verse_start, verse_end").eq("edition", edition).eq("book", book).eq("chapter", chapter),
    supabase.from("highlights").select("verse, color").eq("edition", edition).eq("book", book).eq("chapter", chapter),
    supabase.from("notes").select("id, verse_start, verse_end, body").eq("edition", edition).eq("book", book).eq("chapter", chapter),
  ]);
  return {
    bookmarks: (b.data ?? []).map((r) => ({ id: r.id, verseStart: r.verse_start, verseEnd: r.verse_end })),
    highlights: Object.fromEntries((h.data ?? []).map((r) => [r.verse, r.color as HighlightColor])),
    notes: (n.data ?? []).map((r) => ({ id: r.id, verseStart: r.verse_start, verseEnd: r.verse_end, body: r.body })),
  };
}

export async function getReadingPosition() {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = (await supabase?.from("reading_positions").select("edition, book, chapter, updated_at").maybeSingle()) ?? {};
  return data ?? null;
}
