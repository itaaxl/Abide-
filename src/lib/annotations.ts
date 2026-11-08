export const HIGHLIGHT_COLORS = ["yellow", "green", "blue", "rose"] as const;
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

export const HIGHLIGHT_LABELS: Record<HighlightColor, string> = {
  yellow: "Yellow",
  green: "Green",
  blue: "Blue",
  rose: "Rose",
};

/** Annotations for one chapter, keyed by verse number. Always edition-specific. */
export interface ChapterAnnotations {
  bookmarks: { id: string; verseStart: number; verseEnd: number }[];
  highlights: Record<number, HighlightColor>;
  notes: { id: string; verseStart: number; verseEnd: number; body: string }[];
}

export const NOTE_MAX = 5000;
export const SUGGESTED_TAGS = ["Prayer", "Hope", "Family", "Favorites", "Peace", "Strength"];

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };
