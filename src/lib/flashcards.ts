import "server-only";
import { getEdition, getVerses } from "./bible/provider";

export interface CardRow {
  id: string;
  deck_id: string;
  kind: "ref_to_text" | "text_to_ref" | "cloze" | "custom";
  edition: string | null;
  book: string | null;
  chapter: number | null;
  verse_start: number | null;
  verse_end: number | null;
  front: string | null;
  back: string | null;
  due_at: string;
  interval_days: number;
  ease: number;
  reps: number;
  lapses: number;
  version: number;
}

export interface CardFace {
  id: string;
  kind: CardRow["kind"];
  scripture: boolean;
  front: string;
  back: string;
  /** For cloze: words of the verse, with indices hidden on the front. */
  cloze?: { words: string[]; hidden: number[] };
  reference?: string;
  edition?: string;
  editionAbbr?: string;
  direction: "ltr" | "rtl";
  href?: string;
  version: number;
  state: { intervalDays: number; ease: number; reps: number; lapses: number };
}

/** Deterministic pseudo-random choice of words to hide, seeded by card id. */
export function clozeIndices(words: string[], seed: string): number[] {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const candidates = words.map((w, i) => ({ i, w })).filter(({ w }) => w.replace(/[^\p{L}]/gu, "").length >= 4);
  const target = Math.max(1, Math.round(candidates.length / 4));
  const chosen = new Set<number>();
  let x = h >>> 0;
  while (chosen.size < Math.min(target, candidates.length)) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0;
    chosen.add(candidates[x % candidates.length].i);
  }
  return [...chosen].sort((a, b) => a - b);
}

/** Build card faces from the card's OWN edition so the original translation is preserved. */
export async function buildFace(c: CardRow): Promise<CardFace | null> {
  const state = { intervalDays: c.interval_days, ease: c.ease, reps: c.reps, lapses: c.lapses };
  if (c.kind === "custom")
    return { id: c.id, kind: c.kind, scripture: false, front: c.front ?? "", back: c.back ?? "", direction: "ltr", version: c.version, state };
  const e = await getEdition(c.edition!);
  const verses = await getVerses(c.edition!, c.book!, c.chapter!, c.verse_start!, c.verse_end!);
  if (!e || !verses?.length) return null;
  const name = e.books.find((b) => b.id === c.book)?.name ?? c.book!;
  const reference = `${name} ${c.chapter}:${c.verse_start}${c.verse_end !== c.verse_start ? `–${c.verse_end}` : ""}`;
  const text = verses.map((v) => v.t).join(" ");
  const base = {
    id: c.id,
    kind: c.kind,
    scripture: true,
    reference,
    edition: e.id,
    editionAbbr: e.abbreviation,
    direction: e.direction,
    href: `/bible/${e.id}/${c.book}/${c.chapter}?v=${c.verse_start}-${c.verse_end}#v${c.verse_start}`,
    version: c.version,
    state,
  };
  if (c.kind === "ref_to_text") return { ...base, front: reference, back: text };
  if (c.kind === "text_to_ref") return { ...base, front: text, back: reference };
  const words = text.split(/\s+/);
  return { ...base, front: text, back: text, cloze: { words, hidden: clozeIndices(words, c.id) } };
}
