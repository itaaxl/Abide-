import { COLLECTION_LABELS, type Collection } from "./canon";
import type { EditionMeta } from "./types";

export interface ChapterPointer {
  book: string;
  bookName: string;
  chapter: number;
}

/** Previous/next chapter across book boundaries in this edition's canonical order. */
export function adjacentChapters(edition: EditionMeta, book: string, chapter: number, showDeuterocanon = true) {
  // When hidden, deuterocanonical books are skipped (unless you are reading one).
  const books = edition.books.filter((b) => showDeuterocanon || b.collection !== "deuterocanon" || b.id === book);
  const idx = books.findIndex((b) => b.id === book);
  if (idx < 0) return { prev: null, next: null };
  const b = books[idx];
  let prev: ChapterPointer | null = null;
  let next: ChapterPointer | null = null;
  if (chapter > 1) prev = { book: b.id, bookName: b.name, chapter: chapter - 1 };
  else if (idx > 0) {
    const pb = books[idx - 1];
    prev = { book: pb.id, bookName: pb.name, chapter: pb.chapters.length };
  }
  if (chapter < b.chapters.length) next = { book: b.id, bookName: b.name, chapter: chapter + 1 };
  else if (idx < books.length - 1) {
    const nb = books[idx + 1];
    next = { book: nb.id, bookName: nb.name, chapter: 1 };
  }
  return { prev, next };
}

export function groupBooks(edition: EditionMeta, locale: "en" | "fr" | "ar" = "en", showDeuterocanon = true, keepBook?: string) {
  const order: Collection[] = showDeuterocanon || edition.books.some((b) => b.id === keepBook && b.collection === "deuterocanon") ? ["ot", "deuterocanon", "nt"] : ["ot", "nt"];
  return order
    .map((c) => ({
      collection: c,
      label: COLLECTION_LABELS[c][locale],
      books: edition.books.filter((b) => b.collection === c),
    }))
    .filter((g) => g.books.length > 0);
}

/** Parse "16" or "16-18" from the ?v= parameter. */
export function parseVerseParam(v: string | string[] | undefined): { from: number; to: number } | null {
  if (typeof v !== "string") return null;
  const m = /^(\d{1,3})(?:-(\d{1,3}))?$/.exec(v);
  if (!m) return null;
  const from = Number(m[1]);
  const to = m[2] ? Number(m[2]) : from;
  return to >= from ? { from, to } : null;
}
