import type { Topic } from "@/content/topics";
import { formatReference, passageHref, type PassageRef } from "../bible/reference";
import type { SearchResult } from "../bible/search-index";
import type { EditionMeta, Verse } from "../bible/types";
import { buildUserMessage, SYSTEM_PROMPT } from "./prompt";
import { retrieveCandidates, type Candidate } from "./retrieve";
import { CRISIS_RESPONSE, detectCrisis } from "./safety";
import { guidanceOutputSchema, type GuidanceOutput, type GuidanceResult } from "./schema";

export type ModelOutcome =
  | { status: "ok"; output: unknown; inputTokens: number; outputTokens: number; model: string }
  | { status: "refusal" | "malformed" | "error" | "timeout"; inputTokens?: number; outputTokens?: number };

export interface GuidanceDeps {
  topics: Topic[];
  search: (query: string) => Promise<SearchResult | null>;
  /** Exact verses from the verified dataset for a ref in an edition. */
  verses: (edition: string, ref: PassageRef) => Promise<Verse[] | null>;
  edition: EditionMeta;
  /** True when AI is configured and allowed for this edition. */
  aiAvailable: boolean;
  /** Atomically reserve one request; returns remaining count or null when exhausted. */
  reserve: () => Promise<number | null>;
  callModel: (system: string, user: string) => Promise<ModelOutcome>;
  recordResult: (outcome: ModelOutcome) => Promise<void>;
}

export interface GuidanceInput {
  text: string;
  topic?: string;
  tone?: string;
}

/**
 * Guidance workflow: crisis check -> retrieval from the verified corpus ->
 * (optional) model chooses among candidate ids -> server validates ids and
 * renders Scripture from the dataset. Falls back to curated topic passages,
 * clearly labelled, whenever AI is unavailable or its output is unusable.
 */
export async function runGuidance(input: GuidanceInput, deps: GuidanceDeps): Promise<GuidanceResult> {
  if (detectCrisis(input.text)) {
    return { kind: "crisis", opening: [CRISIS_RESPONSE.title, ...CRISIS_RESPONSE.body].join("\n\n"), passages: [], practicalSteps: [], suggestHumanSupport: true };
  }

  const { candidates, topics } = await retrieveCandidates(input.text, input.topic, deps.topics, deps.search);
  const resolved = (
    await Promise.all(
      candidates.map(async (c) => {
        const vs = await deps.verses(deps.edition.id, c.ref);
        if (!vs?.length) return null; // passage missing or numbered differently in this edition
        return { ...c, label: formatReference(c.ref, deps.edition), text: vs.map((v) => v.t).join(" ") };
      }),
    )
  ).filter((c): c is Candidate & { label: string; text: string } => c !== null);

  const fallback = (reason: NonNullable<GuidanceResult["fallbackReason"]>, remaining?: number): GuidanceResult => {
    const notes = new Map(topics.flatMap((t) => t.passages.map((p) => [p.ref, p.note] as const)));
    const chosen = resolved.filter((c) => c.source === "topic").slice(0, 4);
    const list = chosen.length ? chosen : resolved.slice(0, 3);
    return {
      kind: "fallback",
      fallbackReason: list.length ? reason : "no-matches",
      passages: list.map((c) => toPassage(c, notes.get(c.key) ?? "Found by searching the Bible text for words from your request.", deps.edition)),
      practicalSteps: [],
      suggestHumanSupport: false,
      remainingToday: remaining,
    };
  };

  if (!deps.aiAvailable) return fallback("unconfigured");
  if (resolved.length === 0) return fallback("no-matches");

  const remaining = await deps.reserve();
  if (remaining === null) return fallback("quota");

  const outcome = await deps.callModel(SYSTEM_PROMPT, buildUserMessage(input.text, input.tone, resolved));
  await deps.recordResult(outcome);
  if (outcome.status === "refusal") return fallback("refusal", remaining);
  if (outcome.status !== "ok") return fallback(outcome.status === "malformed" ? "malformed" : "provider-error", remaining);

  const parsed = guidanceOutputSchema.safeParse(outcome.output);
  if (!parsed.success) return fallback("malformed", remaining);
  const validated = validateOutput(parsed.data, resolved, deps.edition);
  if (validated.passages.length === 0) return fallback("malformed", remaining);
  return { ...validated, remainingToday: remaining, model: outcome.model };
}

/** Keep only passages whose ids were actually offered; drop duplicates; clamp lengths. */
export function validateOutput(
  out: GuidanceOutput,
  offered: (Candidate & { label: string; text: string })[],
  edition: EditionMeta,
): GuidanceResult {
  const byId = new Map(offered.map((c) => [c.id, c]));
  const used = new Set<string>();
  const passages = out.passages
    .filter((p) => {
      const ok = byId.has(p.id.trim()) && !used.has(p.id.trim());
      used.add(p.id.trim());
      return ok;
    })
    .slice(0, 4)
    .map((p) => toPassage(byId.get(p.id.trim())!, clamp(p.connection, 700), edition));
  return {
    kind: "ai",
    opening: clamp(out.opening, 500),
    passages,
    practicalSteps: out.practical_steps.slice(0, 3).map((s) => clamp(s, 240)).filter(Boolean),
    prayer: out.prayer ? clamp(out.prayer, 700) : undefined,
    suggestHumanSupport: out.suggest_human_support,
  };
}

const clamp = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s).trim();

function toPassage(c: Candidate & { label: string; text: string }, connection: string, edition: EditionMeta): GuidanceResult["passages"][number] {
  const verseStart = c.ref.verse ?? 1;
  return {
    key: c.key,
    label: c.label,
    edition: edition.id,
    editionAbbr: edition.abbreviation,
    direction: edition.direction,
    text: c.text,
    connection,
    href: passageHref(edition.id, c.ref),
    chapterHref: `/bible/${edition.id}/${c.ref.book}/${c.ref.chapter}`,
    book: c.ref.book,
    chapter: c.ref.chapter,
    verseStart,
    verseEnd: c.ref.endVerse ?? verseStart,
  };
}
