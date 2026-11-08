import type { Topic } from "@/content/topics";
import { tokenize } from "../bible/normalize";
import { parseRefKey, refKey, type PassageRef } from "../bible/reference";
import type { SearchResult } from "../bible/search-index";

/**
 * Candidate retrieval for guidance. Pure and testable: callers inject the
 * topic list and a search function over the verified corpus.
 */
export interface Candidate {
  /** Opaque id shown to the model, e.g. "P3". */
  id: string;
  ref: PassageRef;
  key: string;
  source: "topic" | "search";
  topic?: string;
}

const STOP = new Set(
  "i me my myself we our you your he she it they them a an the and or but if so of to in on at by for with about as is am are was were be been being have has had do does did not no can could would should will just very really feel feeling felt want need trying try how what when why who this that these those there here im ive dont cant its from into over more most some any all also get got lot things thing life time".split(" "),
);

export function matchTopics(text: string, topics: Topic[], preferred?: string): Topic[] {
  const tokens = new Set(tokenize(text));
  const lower = text.toLowerCase();
  const scored = topics
    .map((t) => ({
      t,
      score:
        (t.slug === preferred ? 100 : 0) +
        t.keywords.reduce((s, k) => s + (k.includes(" ") ? (lower.includes(k) ? 2 : 0) : tokens.has(k) ? 1 : 0), 0),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((x) => x.t);
}

export function significantTerms(text: string, max = 6): string[] {
  return [...new Set(tokenize(text).filter((w) => w.length >= 4 && !STOP.has(w)))].slice(0, max);
}

export async function retrieveCandidates(
  text: string,
  preferredTopic: string | undefined,
  topics: Topic[],
  search: (query: string) => Promise<SearchResult | null>,
  limit = 16,
): Promise<{ candidates: Candidate[]; topics: Topic[] }> {
  const matched = matchTopics(text, topics, preferredTopic);
  const out: Candidate[] = [];
  const seen = new Set<string>();
  const push = (ref: PassageRef, source: Candidate["source"], topic?: string) => {
    const key = refKey(ref);
    if (seen.has(key) || out.length >= limit) return;
    seen.add(key);
    out.push({ id: `P${out.length + 1}`, ref, key, source, topic });
  };
  for (const t of matched) for (const p of t.passages) push(parseRefKey(p.ref)!, "topic", t.slug);
  // Indexed corpus search on the person's own words (each term separately, most specific first).
  for (const term of significantTerms(text)) {
    if (out.length >= limit) break;
    const r = await search(term);
    for (const h of r?.hits.slice(0, 2) ?? []) push({ book: h.book, chapter: h.chapter, verse: h.verse }, "search");
  }
  // Always offer some general passages so the model has a meaningful choice.
  if (out.length < 6) {
    for (const slug of ["peace", "hope", "closer-to-god"]) {
      const t = topics.find((x) => x.slug === slug);
      for (const p of t?.passages.slice(0, 2) ?? []) push(parseRefKey(p.ref)!, "topic", slug);
    }
  }
  return { candidates: out, topics: matched };
}
