import "server-only";
import { resolvePassage } from "./bible/passage";
import { refKey } from "./bible/reference";
import { getDailyVerses } from "./content";
import { ROTATION_EPOCH } from "./daily";
import { addDays, daysBetween } from "./time";

export interface VerseCardData {
  id: string;
  /** Local date this card is "the daily verse" for; first card = today. */
  date: string;
  text: string;
  reference: string;
  editionId: string;
  editionAbbr: string;
  editionName: string;
  direction: "ltr" | "rtl";
  language: string;
  /** Short editorial line, shown separately and labelled "Reflection". */
  /** Short editorial phrase (English only; omitted for other languages). Not Scripture. */
  reflection: string | null;
  chapterHref: string;
  shareKey: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  /** Set when the requested translation numbers this passage differently. */
  fallbackNote?: string;
}

/**
 * The daily-verse rotation as cards: the card for `startDate` first, then the
 * following days' verses. Verse text always comes from the verified dataset.
 */
export async function buildVerseCards(startDate: string, edition: string, count = 15): Promise<VerseCardData[]> {
  const list = await getDailyVerses();
  const n = list.length;
  const startIdx = (((daysBetween(ROTATION_EPOCH, startDate) % n) + n) % n) as number;
  const cards = await Promise.all(
    Array.from({ length: Math.min(count, n) }, async (_, i) => {
      const entry = list[(startIdx + i) % n];
      const p = await resolvePassage(entry.ref, edition);
      if (!p) return null;
      const r = p.ref;
      const card: VerseCardData = {
        id: entry.id,
        date: addDays(startDate, i),
        text: p.text,
        reference: p.label,
        editionId: p.edition.id,
        editionAbbr: p.edition.abbreviation,
        editionName: p.edition.name,
        direction: p.edition.direction,
        language: p.edition.language,
        reflection: p.edition.language.startsWith("en") && entry.phrase ? entry.phrase : null,
        chapterHref: `/bible/${p.edition.id}/${r.book}/${r.chapter}${r.verse ? `?v=${r.verse}${r.endVerse ? `-${r.endVerse}` : ""}#v${r.verse}` : ""}`,
        shareKey: refKey(r),
        book: r.book,
        chapter: r.chapter,
        verseStart: r.verse ?? 1,
        verseEnd: r.endVerse ?? r.verse ?? 1,
      };
      if (p.fallbackFrom) card.fallbackNote = `Shown in ${p.edition.abbreviation}: numbering differs in the selected translation.`;
      return card;
    }),
  );
  return cards.filter((c): c is VerseCardData => c !== null);
}
