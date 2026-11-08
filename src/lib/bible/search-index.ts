import type { Collection } from "./canon";
import { foldText, tokenize, tokenizeWithOffsets } from "./normalize";
import type { CorpusRow, EditionMeta } from "./types";

/**
 * In-memory inverted index over an edition's verses. Built once per server
 * instance per edition (~38k verses), then every query is a set of posting
 * list lookups — never a full scan per keystroke.
 */
export interface SearchIndex {
  rows: CorpusRow[];
  postings: Map<string, Uint32Array>;
  /** Sorted vocabulary for prefix lookups. */
  vocab: string[];
}

export function buildIndex(rows: CorpusRow[]): SearchIndex {
  const lists = new Map<string, number[]>();
  rows.forEach((row, i) => {
    const seen = new Set<string>();
    for (const tok of tokenize(row[3])) {
      if (seen.has(tok)) continue;
      seen.add(tok);
      let l = lists.get(tok);
      if (!l) lists.set(tok, (l = []));
      l.push(i);
    }
  });
  const postings = new Map<string, Uint32Array>();
  for (const [k, v] of lists) postings.set(k, Uint32Array.from(v));
  return { rows, postings, vocab: [...postings.keys()].sort() };
}

function prefixTerms(index: SearchIndex, prefix: string, limit = 50): string[] {
  let lo = 0;
  let hi = index.vocab.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (index.vocab[mid] < prefix) lo = mid + 1;
    else hi = mid;
  }
  const out: string[] = [];
  for (let i = lo; i < index.vocab.length && out.length < limit; i++) {
    if (!index.vocab[i].startsWith(prefix)) break;
    out.push(index.vocab[i]);
  }
  return out;
}

export interface SearchOptions {
  page?: number;
  pageSize?: number;
  book?: string;
  collection?: Collection;
  sort?: "relevance" | "canonical";
}

export interface SearchHit {
  book: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  /** Text split into plain and matched parts for safe highlighting. */
  parts: { text: string; match: boolean }[];
  score: number;
}

export interface SearchResult {
  query: string;
  terms: string[];
  phrase: boolean;
  total: number;
  page: number;
  pageSize: number;
  hits: SearchHit[];
  /** Per-book counts for the unfiltered query, for filter UI. */
  bookCounts: { book: string; count: number }[];
}

const MAX_TERMS = 8;

export function searchIndex(
  index: SearchIndex,
  edition: EditionMeta,
  query: string,
  opts: SearchOptions = {},
): SearchResult {
  const pageSize = Math.min(Math.max(opts.pageSize ?? 20, 1), 50);
  const page = Math.max(opts.page ?? 1, 1);
  const trimmed = query.trim().slice(0, 200);
  const phrase = /^".+"$/.test(trimmed);
  const terms = [...new Set(tokenize(trimmed))].slice(0, MAX_TERMS);
  const empty: SearchResult = { query: trimmed, terms, phrase, total: 0, page, pageSize, hits: [], bookCounts: [] };
  if (terms.length === 0) return empty;

  const N = index.rows.length;
  // For each term: exact postings plus prefix expansions (lower weight) for terms of 4+ chars.
  const termScores: Map<number, number>[] = [];
  const matchForms: Set<string> = new Set();
  for (const term of terms) {
    const scores = new Map<number, number>();
    const exact = index.postings.get(term);
    const idf = (list: Uint32Array) => Math.log(1 + N / list.length);
    if (exact) {
      const w = idf(exact);
      for (const i of exact) scores.set(i, w);
      matchForms.add(term);
    }
    if (!phrase && term.length >= 4) {
      for (const form of prefixTerms(index, term)) {
        if (form === term) continue;
        const list = index.postings.get(form)!;
        const w = idf(list) * 0.6;
        for (const i of list) scores.set(i, Math.max(scores.get(i) ?? 0, w));
        matchForms.add(form);
      }
    }
    if (scores.size === 0) return empty; // every term must match
    termScores.push(scores);
  }

  // Intersect (all terms required), smallest list first.
  termScores.sort((a, b) => a.size - b.size);
  const candidates: { i: number; score: number }[] = [];
  const foldedPhrase = phrase ? foldText(trimmed.slice(1, -1)).replace(/\s+/g, " ") : "";
  for (const [i, s0] of termScores[0]) {
    let score = s0;
    let ok = true;
    for (let t = 1; t < termScores.length; t++) {
      const s = termScores[t].get(i);
      if (s === undefined) {
        ok = false;
        break;
      }
      score += s;
    }
    if (!ok) continue;
    const foldedText = foldText(index.rows[i][3]);
    if (phrase && !foldedText.replace(/\s+/g, " ").includes(foldedPhrase)) continue;
    // Bonus when the words appear together in order.
    if (!phrase && terms.length > 1 && foldedText.includes(terms.join(" "))) score *= 1.5;
    // Shorter verses with the same words rank slightly higher.
    score /= 1 + Math.log(1 + index.rows[i][3].length / 200);
    candidates.push({ i, score });
  }

  const bookCountMap = new Map<number, number>();
  for (const c of candidates) bookCountMap.set(index.rows[c.i][0], (bookCountMap.get(index.rows[c.i][0]) ?? 0) + 1);

  let filtered = candidates;
  if (opts.book) filtered = filtered.filter((c) => edition.books[index.rows[c.i][0]]?.id === opts.book);
  if (opts.collection) filtered = filtered.filter((c) => edition.books[index.rows[c.i][0]]?.collection === opts.collection);

  if (opts.sort === "canonical") filtered.sort((a, b) => a.i - b.i);
  else filtered.sort((a, b) => b.score - a.score || a.i - b.i);

  const start = (page - 1) * pageSize;
  const hits = filtered.slice(start, start + pageSize).map(({ i, score }) => {
    const [bi, chapter, verse, text] = index.rows[i];
    const book = edition.books[bi];
    return {
      book: book.id,
      bookName: book.name,
      chapter,
      verse,
      text,
      parts: highlightParts(text, matchForms),
      score: Math.round(score * 100) / 100,
    };
  });

  return {
    ...empty,
    total: filtered.length,
    hits,
    bookCounts: [...bookCountMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([bi, count]) => ({ book: edition.books[bi].id, count })),
  };
}

/** Split text into matched/unmatched runs without changing any characters. */
export function highlightParts(text: string, forms: Set<string>): { text: string; match: boolean }[] {
  const parts: { text: string; match: boolean }[] = [];
  let pos = 0;
  for (const { token, start, end } of tokenizeWithOffsets(text)) {
    // Tokens with apostrophes are split by tokenize(); match on any sub-token.
    const subs = token.split(/'/);
    if (!subs.some((s) => forms.has(s))) continue;
    if (start > pos) parts.push({ text: text.slice(pos, start), match: false });
    parts.push({ text: text.slice(start, end), match: true });
    pos = end;
  }
  if (pos < text.length) parts.push({ text: text.slice(pos), match: false });
  return parts;
}
