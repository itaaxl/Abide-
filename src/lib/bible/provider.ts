import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Chapter, CorpusRow, EditionMeta, Verse } from "./types";

/**
 * Every Scripture source implements this interface so the reader, search,
 * daily verse, flashcards and guidance features never depend on where the
 * text comes from. See docs/BIBLE_PROVIDERS.md for adding a licensed provider.
 */
export interface BibleProvider {
  readonly kind: string;
  getEdition(): Promise<EditionMeta>;
  getChapter(book: string, chapter: number): Promise<Chapter | null>;
  getCorpus(): Promise<CorpusRow[]>;
}

const DATA_DIR = path.join(process.cwd(), "data", "bibles");

/** Reads the validated public-domain editions imported into data/bibles. */
class LocalFileProvider implements BibleProvider {
  readonly kind = "local-file";
  private edition?: Promise<EditionMeta>;
  private corpus?: Promise<CorpusRow[]>;
  constructor(private readonly id: string) {}

  getEdition() {
    this.edition ??= readFile(path.join(DATA_DIR, this.id, "edition.json"), "utf8").then(
      (s) => JSON.parse(s) as EditionMeta,
    );
    return this.edition;
  }

  async getChapter(book: string, chapter: number): Promise<Chapter | null> {
    if (!/^[A-Z0-9]{3}$/.test(book) || !Number.isInteger(chapter) || chapter < 1) return null;
    try {
      const raw = JSON.parse(
        await readFile(path.join(DATA_DIR, this.id, "chapters", book, `${chapter}.json`), "utf8"),
      ) as Chapter;
      raw.verses = raw.verses.map((v) => withText(v));
      return raw;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }

  getCorpus() {
    this.corpus ??= readFile(path.join(DATA_DIR, this.id, "corpus.json"), "utf8").then(
      (s) => JSON.parse(s) as CorpusRow[],
    );
    return this.corpus;
  }
}

function withText(v: Omit<Verse, "t"> & { t?: string }): Verse {
  const t =
    v.t ??
    v.segs
      .filter((s) => s.s !== "sp")
      .map((s) => s.t)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  return { ...v, t };
}

const providers = new Map<string, BibleProvider>();
let editionIds: Promise<string[]> | undefined;

export function listEditionIds(): Promise<string[]> {
  editionIds ??= readFile(path.join(DATA_DIR, "index.json"), "utf8")
    .then((s) => JSON.parse(s) as string[])
    .catch(() => []);
  return editionIds;
}

export async function getProvider(editionId: string): Promise<BibleProvider | null> {
  const ids = await listEditionIds();
  if (!ids.includes(editionId)) return null;
  let p = providers.get(editionId);
  if (!p) {
    p = new LocalFileProvider(editionId);
    providers.set(editionId, p);
  }
  return p;
}

export async function getEdition(editionId: string): Promise<EditionMeta | null> {
  const p = await getProvider(editionId);
  return p ? p.getEdition() : null;
}

export async function listEditions(): Promise<EditionMeta[]> {
  const ids = await listEditionIds();
  return Promise.all(ids.map(async (id) => (await getProvider(id))!.getEdition()));
}

export async function getChapter(editionId: string, book: string, chapter: number): Promise<Chapter | null> {
  const p = await getProvider(editionId);
  return p ? p.getChapter(book, chapter) : null;
}

/** Verses for a passage within one chapter (inclusive). */
export async function getVerses(
  editionId: string,
  book: string,
  chapter: number,
  from?: number,
  to?: number,
): Promise<Verse[] | null> {
  const ch = await getChapter(editionId, book, chapter);
  if (!ch) return null;
  if (from === undefined) return ch.verses;
  const end = to ?? from;
  return ch.verses.filter((v) => (v.ve ?? v.v) >= from && v.v <= end);
}

/** Lightweight edition summary safe to send to the browser. */
export interface EditionSummary {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
  languageName: string;
  direction: "ltr" | "rtl";
}

export function summarize(e: EditionMeta): EditionSummary {
  return {
    id: e.id,
    name: e.name,
    abbreviation: e.abbreviation,
    language: e.language,
    languageName: e.languageName,
    direction: e.direction,
  };
}
