import "server-only";
import { getChapter, getEdition } from "./provider";
import type { PassageRef } from "./reference";

export type MappingStatus = "same" | "psalm-title-offset" | "unmapped" | "missing-book";

/**
 * Map a reference written in one edition's numbering to another edition.
 *
 * We do not have a licensed, verified versification table, so mapping is
 * deliberately conservative:
 *  - identical verse counts for the chapter      -> same numbers,
 *  - Psalms where one edition prints the title separately and the other
 *    counts it as verse 1 (or 1–2)               -> shift by the difference,
 *  - anything else                               -> "unmapped"; callers must
 *    show the source edition instead of guessing.
 */
export async function mapReference(
  ref: PassageRef,
  fromEdition: string,
  toEdition: string,
): Promise<{ ref: PassageRef | null; status: MappingStatus }> {
  if (fromEdition === toEdition) return { ref, status: "same" };
  const [from, to] = await Promise.all([getEdition(fromEdition), getEdition(toEdition)]);
  const fb = from?.books.find((b) => b.id === ref.book);
  const tb = to?.books.find((b) => b.id === ref.book);
  if (!from || !to || !fb || !tb) return { ref: null, status: "missing-book" };
  if (ref.endChapter !== undefined) {
    // Multi-chapter passages: only map when every chapter has identical counts.
    for (let c = ref.chapter; c <= ref.endChapter; c++)
      if (fb.chapters[c - 1] !== tb.chapters[c - 1]) return { ref: null, status: "unmapped" };
    return { ref, status: "same" };
  }
  const fc = fb.chapters[ref.chapter - 1];
  const tc = tb.chapters[ref.chapter - 1];
  if (fc === undefined || tc === undefined) return { ref: null, status: "unmapped" };
  if (fc === tc) return { ref, status: "same" };
  if (ref.book === "PSA" && from.psalmTitles !== to.psalmTitles) {
    const diff = tc - fc;
    const titled = from.psalmTitles === "separate" ? await getChapter(fromEdition, "PSA", ref.chapter) : await getChapter(toEdition, "PSA", ref.chapter);
    if (titled?.title && Math.abs(diff) >= 1 && Math.abs(diff) <= 2) {
      const shift = (n?: number) => (n === undefined ? undefined : n + diff);
      const mapped: PassageRef = { book: "PSA", chapter: ref.chapter };
      if (ref.verse !== undefined) mapped.verse = shift(ref.verse);
      if (ref.endVerse !== undefined) mapped.endVerse = shift(ref.endVerse);
      if ((mapped.verse ?? 1) >= 1 && (mapped.endVerse ?? mapped.verse ?? 1) <= tc) return { ref: mapped, status: "psalm-title-offset" };
    }
  }
  if (ref.verse === undefined) return { ref, status: "same" }; // whole chapter: same chapter exists
  return { ref: null, status: "unmapped" };
}
