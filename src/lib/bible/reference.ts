import { ARABIC_BOOKS, ENGLISH_BOOKS, FRENCH_ALIASES } from "./canon";
import { foldText, toAsciiDigits } from "./normalize";
import type { BookMeta, EditionMeta } from "./types";

export interface PassageRef {
  book: string;
  chapter: number;
  /** First verse; undefined means the whole chapter. */
  verse?: number;
  /** Last verse (same chapter unless endChapter is set). */
  endVerse?: number;
  endChapter?: number;
}

export type ParseResult =
  | { ok: true; ref: PassageRef; book: BookMeta }
  | { ok: false; reason: "not-reference" }
  | { ok: false; reason: "unknown-book"; bookText: string }
  | { ok: false; reason: "book-not-in-edition"; book: string }
  | { ok: false; reason: "chapter-out-of-range"; book: BookMeta; chapter: number }
  | { ok: false; reason: "verse-out-of-range"; book: BookMeta; chapter: number; verse: number; maxVerse: number }
  | { ok: false; reason: "invalid-range"; book: BookMeta };

const ORDINALS: [RegExp, string][] = [
  [/^(iii|3rd|third|troisieme|3e|3eme)\s+/, "3 "],
  [/^(ii|2nd|second|deuxieme|2e|2eme)\s+/, "2 "],
  [/^(iv|4th|fourth)\s+/, "4 "],
  [/^(i|1st|first|premier|premiere|1er|1re)\s+/, "1 "],
];

function normalizeBookText(s: string): string {
  let t = foldText(s).replace(/[.]/g, " ").replace(/\s+/g, " ").trim();
  for (const [re, rep] of ORDINALS) t = t.replace(re, rep);
  // "1john" -> "1 john"
  t = t.replace(/^([1-4])\s*(?=\p{L})/u, "$1 ");
  return t;
}

const aliasCache = new Map<string, Map<string, string>>();

/** Build alias -> book code map for an edition (cached per edition). */
export function aliasMap(edition: EditionMeta): Map<string, string> {
  const cached = aliasCache.get(edition.id);
  if (cached) return cached;
  const map = new Map<string, string>();
  const add = (alias: string, code: string) => {
    const key = normalizeBookText(alias);
    if (key && !map.has(key)) map.set(key, code);
  };
  // Edition names first so they win, then curated aliases in all supported languages.
  for (const b of edition.books) {
    add(b.name, b.id);
    add(b.longName, b.id);
  }
  for (const table of [ENGLISH_BOOKS, FRENCH_ALIASES, ARABIC_BOOKS]) {
    for (const [code, names] of Object.entries(table)) for (const n of names) add(n, code);
  }
  // Arabic names are often written without the definite article.
  for (const [code, names] of Object.entries(ARABIC_BOOKS)) {
    for (const n of names) {
      const folded = normalizeBookText(n);
      if (folded.startsWith("ال")) add(folded.slice(2), code);
    }
  }
  aliasCache.set(edition.id, map);
  return map;
}

const REF_RE =
  /^(.+?)\s*(\d+)(?:\s*[:.,]\s*(\d+)(?:\s*[-–—]\s*(?:(\d+)\s*[:.]\s*)?(\d+))?|\s*[-–—]\s*(\d+))?\s*$/u;

export function resolveBook(edition: EditionMeta, text: string): string | undefined {
  return aliasMap(edition).get(normalizeBookText(text));
}

/**
 * Parse references such as "John 3:16", "John 3:16-18", "Psalm 23",
 * "1 Corinthians 13", "1co 13:4-7", "Jean 3.16", "يوحنا ٣:١٦", or "John".
 * Bounds are validated against the given edition.
 */
export function parseReference(input: string, edition: EditionMeta): ParseResult {
  const raw = toAsciiDigits(input).replace(/\s+/g, " ").trim();
  if (!raw) return { ok: false, reason: "not-reference" };

  let bookText: string;
  let chapter = 1;
  let verse: number | undefined;
  let endVerse: number | undefined;
  let endChapter: number | undefined;
  let chapterOnlyRangeEnd: number | undefined;

  const m = REF_RE.exec(raw);
  if (m && /\p{L}/u.test(m[1])) {
    bookText = m[1];
    chapter = Number(m[2]);
    if (m[3]) verse = Number(m[3]);
    if (m[5]) {
      if (m[4]) {
        endChapter = Number(m[4]);
        endVerse = Number(m[5]);
      } else endVerse = Number(m[5]);
    }
    if (m[6]) chapterOnlyRangeEnd = Number(m[6]);
  } else if (/^\p{L}[\p{L}\p{M}\s.'’]*$/u.test(raw) || /^[1-4]\s*\p{L}[\p{L}\p{M}\s.'’]*$/u.test(raw)) {
    bookText = raw; // book only -> chapter 1
  } else {
    return { ok: false, reason: "not-reference" };
  }

  const code = resolveBook(edition, bookText);
  if (!code) {
    // Words followed by a number look like a reference to an unknown book;
    // plain words are treated as a keyword search by the caller.
    return m ? { ok: false, reason: "unknown-book", bookText } : { ok: false, reason: "not-reference" };
  }
  const book = edition.books.find((b) => b.id === code);
  if (!book) return { ok: false, reason: "book-not-in-edition", book: code };

  if (chapter < 1 || chapter > book.chapters.length) return { ok: false, reason: "chapter-out-of-range", book, chapter };
  if (chapterOnlyRangeEnd !== undefined) {
    // "Psalm 23-24" is a chapter range; we open the first chapter.
    if (chapterOnlyRangeEnd < chapter || chapterOnlyRangeEnd > book.chapters.length)
      return { ok: false, reason: "invalid-range", book };
    if (chapterOnlyRangeEnd !== chapter) endChapter = chapterOnlyRangeEnd;
  }
  const maxVerse = book.chapters[chapter - 1];
  if (verse !== undefined && (verse < 1 || verse > maxVerse))
    return { ok: false, reason: "verse-out-of-range", book, chapter, verse, maxVerse };
  if (endChapter !== undefined && endVerse !== undefined) {
    if (endChapter < chapter || endChapter > book.chapters.length) return { ok: false, reason: "invalid-range", book };
    const endMax = book.chapters[endChapter - 1];
    if (endVerse < 1 || endVerse > endMax)
      return { ok: false, reason: "verse-out-of-range", book, chapter: endChapter, verse: endVerse, maxVerse: endMax };
    if (endChapter === chapter) {
      endChapter = undefined;
    }
  }
  if (endVerse !== undefined && endChapter === undefined) {
    if (endVerse > maxVerse)
      return { ok: false, reason: "verse-out-of-range", book, chapter, verse: endVerse, maxVerse };
    if (verse !== undefined && endVerse < verse) return { ok: false, reason: "invalid-range", book };
    if (endVerse === verse) endVerse = undefined;
  }

  const ref: PassageRef = { book: book.id, chapter };
  if (verse !== undefined) ref.verse = verse;
  if (endVerse !== undefined) ref.endVerse = endVerse;
  if (endChapter !== undefined) ref.endChapter = endChapter;
  return { ok: true, ref, book };
}

/** Human-readable reference using the edition's book names. */
export function formatReference(ref: PassageRef, edition: EditionMeta): string {
  const name = edition.books.find((b) => b.id === ref.book)?.name ?? ref.book;
  let s = `${name} ${ref.chapter}`;
  if (ref.verse !== undefined) s += `:${ref.verse}`;
  if (ref.endChapter !== undefined) s += `–${ref.endChapter}${ref.endVerse !== undefined ? `:${ref.endVerse}` : ""}`;
  else if (ref.endVerse !== undefined) s += `–${ref.endVerse}`;
  return s;
}

/** Canonical compact key, stable across UI languages: "JHN.3.16-18". */
export function refKey(ref: PassageRef): string {
  let s = `${ref.book}.${ref.chapter}`;
  if (ref.verse !== undefined) s += `.${ref.verse}`;
  if (ref.endChapter !== undefined) s += `-${ref.endChapter}.${ref.endVerse ?? ""}`;
  else if (ref.endVerse !== undefined) s += `-${ref.endVerse}`;
  return s;
}

export function parseRefKey(key: string): PassageRef | null {
  const m = /^([A-Z0-9]{3})\.(\d+)(?:\.(\d+))?(?:-(?:(\d+)\.)?(\d+))?$/.exec(key);
  if (!m) return null;
  const ref: PassageRef = { book: m[1], chapter: Number(m[2]) };
  if (m[3]) ref.verse = Number(m[3]);
  if (m[4]) {
    ref.endChapter = Number(m[4]);
    if (m[5]) ref.endVerse = Number(m[5]);
  } else if (m[5]) ref.endVerse = Number(m[5]);
  return ref;
}

/** URL path for a passage in the reader. */
export function passageHref(edition: string, ref: PassageRef): string {
  const base = `/bible/${edition}/${ref.book}/${ref.chapter}`;
  if (ref.verse === undefined) return base;
  const hl = ref.endVerse !== undefined && ref.endChapter === undefined ? `${ref.verse}-${ref.endVerse}` : `${ref.verse}`;
  return `${base}?v=${hl}#v${ref.verse}`;
}
