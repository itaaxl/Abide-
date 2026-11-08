import "server-only";
import { site } from "@/config/site";
import { mapReference, type MappingStatus } from "./mapping";
import { getEdition, getVerses } from "./provider";
import { formatReference, parseRefKey, passageHref, type PassageRef } from "./reference";
import type { EditionMeta, Verse } from "./types";

export interface ResolvedPassage {
  edition: EditionMeta;
  ref: PassageRef;
  label: string;
  href: string;
  verses: Verse[];
  text: string;
  /** How the reference was mapped into the requested edition. */
  mapping: MappingStatus;
  /** Set when we had to show a different edition than requested. */
  fallbackFrom?: string;
}

/**
 * Resolve a canonical reference key (WEB numbering by default) into verified
 * Scripture text from the requested edition. Never guesses: if the passage
 * cannot be mapped safely, it falls back to the source edition and says so.
 */
export async function resolvePassage(
  key: string,
  editionId: string,
  sourceEdition: string = site.defaultEdition,
): Promise<ResolvedPassage | null> {
  const ref = parseRefKey(key);
  if (!ref) return null;
  const { ref: mapped, status } = await mapReference(ref, sourceEdition, editionId);
  if (!mapped) {
    const fb = await resolvePassage(key, sourceEdition, sourceEdition);
    return fb ? { ...fb, mapping: status, fallbackFrom: editionId } : null;
  }
  const edition = await getEdition(editionId);
  if (!edition) return null;
  const verses: Verse[] = [];
  const endChapter = mapped.endChapter ?? mapped.chapter;
  for (let c = mapped.chapter; c <= endChapter; c++) {
    let from: number | undefined;
    let to: number | undefined;
    if (mapped.endChapter === undefined) {
      from = mapped.verse;
      to = mapped.endVerse ?? mapped.verse;
    } else {
      from = c === mapped.chapter ? (mapped.verse ?? 1) : 1;
      to = c === endChapter ? (mapped.endVerse ?? 999) : 999;
    }
    const vs = await getVerses(edition.id, mapped.book, c, from, to);
    if (!vs) return null;
    verses.push(...vs);
  }
  return {
    edition,
    ref: mapped,
    label: formatReference(mapped, edition),
    href: passageHref(edition.id, mapped),
    verses,
    text: verses.map((v) => v.t).filter(Boolean).join(" "),
    mapping: status,
  };
}
