/**
 * Text normalization used only for matching (search and reference lookup).
 * Scripture wording itself is never altered for display.
 */

const ARABIC_DIGITS = /[٠-٩۰-۹]/g;

export function toAsciiDigits(s: string): string {
  return s.replace(ARABIC_DIGITS, (d) => {
    const c = d.charCodeAt(0);
    return String(c >= 0x06f0 ? c - 0x06f0 : c - 0x0660);
  });
}

/** Lowercase, strip accents and Arabic diacritics, unify letter variants. */
export function foldText(s: string): string {
  return toAsciiDigits(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // Latin combining accents
    .replace(/[ً-ٰٟۖ-ۭـ]/g, "") // Arabic harakat, dagger alif, Quranic marks, tatweel
    .normalize("NFC")
    .replace(/[آأإٱ]/g, "ا") // alef variants -> bare alef
    .replace(/ى/g, "ي") // alef maqsura -> yeh
    .replace(/ة/g, "ه") // teh marbuta -> heh
    .replace(/[‌-‏‪-‮]/g, "")
    .replace(/[’‘`´]/g, "'")
    .toLowerCase();
}

// Include combining marks so Arabic words with harakat stay whole.
const WORD = /[\p{L}\p{N}\p{M}]+/gu;

/** Tokenize folded text. Apostrophes split words (l’Éternel -> l, eternel). */
export function tokenize(s: string): string[] {
  return foldText(s).match(WORD) ?? [];
}

/** Tokenize original text keeping character offsets, for safe highlighting. */
export function tokenizeWithOffsets(s: string): { token: string; start: number; end: number }[] {
  const out: { token: string; start: number; end: number }[] = [];
  for (const m of s.matchAll(WORD)) {
    const start = m.index ?? 0;
    out.push({ token: foldText(m[0]), start, end: start + m[0].length });
  }
  return out;
}
