import type { Collection } from "./canon";

export type TextDirection = "ltr" | "rtl";

export interface EditionLicense {
  /** Short status, e.g. "Public Domain". */
  status: string;
  /** Plain-language summary of the conditions verified at import time. */
  summary: string;
  /** Attribution text shown when Scripture is copied or shared. */
  attribution: string;
  /** Whether verse text may be sent to an AI provider for guidance features. */
  aiProcessingAllowed: boolean;
  /** Whether verse text may be cached/redistributed by this site. */
  redistributionAllowed: boolean;
  copyrightUrl: string;
}

export interface BookMeta {
  /** USFM book code, e.g. "JHN". */
  id: string;
  /** Display name taken from the edition source (localized). */
  name: string;
  /** Longer title from the edition source, e.g. "The Good News According to John". */
  longName: string;
  collection: Collection;
  /** Position in this edition's canonical order (0-based). */
  order: number;
  /** Number of verse slots per chapter (index 0 = chapter 1). */
  chapters: number[];
}

export interface EditionMeta {
  /** Stable edition identifier used in URLs and saved records, e.g. "eng-web". */
  id: string;
  name: string;
  abbreviation: string;
  /** BCP-47 language tag. */
  language: string;
  languageName: string;
  direction: TextDirection;
  canonDescription: string;
  /** Psalm-title numbering convention, for parallel-reading warnings. */
  psalmTitles: "separate" | "verse-one" | "none";
  license: EditionLicense;
  source: {
    publisher: string;
    url: string;
    usfmArchive: string;
    vplArchive: string;
    usfmSha256: string;
    vplSha256: string;
    retrievedAt: string;
  };
  stats: { books: number; chapters: number; verses: number };
  books: BookMeta[];
}

/** One run of verse text in a single paragraph style. */
export interface VerseSegment {
  /** Text. */
  t: string;
  /** Paragraph style from the source (p, m, q1, q2, pi1, li1, ...). */
  s: string;
  /** 1 when a new paragraph/line begins with this segment. */
  n?: 1;
  /** 1 when a stanza break (USFM \b) precedes this segment. */
  b?: 1;
}

export interface Verse {
  /** Verse number. */
  v: number;
  /** End verse when the source combines verses (e.g. "15-16"). */
  ve?: number;
  /** Full plain text (segments joined). Immutable Scripture wording. */
  t: string;
  segs: VerseSegment[];
  /** Translator footnotes from the edition. */
  notes?: string[];
  /** Cross-references from the edition (only where provenance is verified). */
  xrefs?: string[];
}

export interface Chapter {
  edition: string;
  book: string;
  chapter: number;
  /** Psalm superscription when the edition prints it separately from verse 1. */
  title?: string;
  verses: Verse[];
}

/** Compact search corpus row: [bookIndex, chapter, verse, text]. */
export type CorpusRow = [number, number, number, string];
