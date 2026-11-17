import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DAILY_VERSES } from "@/content/daily-verses";
import { PLANS } from "@/content/plans";
import { TOPICS } from "@/content/topics";
import { mapReference } from "@/lib/bible/mapping";
import { parseRefKey } from "@/lib/bible/reference";
import type { EditionMeta } from "@/lib/bible/types";

const web = JSON.parse(readFileSync("data/bibles/eng-web/edition.json", "utf8")) as EditionMeta;
const others = ["fra-lsg", "arb-vd"].map((id) => JSON.parse(readFileSync(`data/bibles/${id}/edition.json`, "utf8")) as EditionMeta);

function assertValid(key: string, edition: EditionMeta) {
  const ref = parseRefKey(key);
  expect(ref, key).not.toBeNull();
  const book = edition.books.find((b) => b.id === ref!.book);
  expect(book, `${key} book in ${edition.id}`).toBeDefined();
  const max = book!.chapters[ref!.chapter - 1];
  expect(max, `${key} chapter`).toBeGreaterThan(0);
  if (ref!.verse !== undefined) {
    expect(ref!.verse).toBeGreaterThanOrEqual(1);
    expect(ref!.verse, key).toBeLessThanOrEqual(max);
  }
  if (ref!.endVerse !== undefined) {
    expect(ref!.endVerse, key).toBeLessThanOrEqual(max);
    expect(ref!.endVerse).toBeGreaterThan(ref!.verse!);
  }
}

describe("curated content references", () => {
  it("daily verses are valid WEB references with unique ids", () => {
    expect(new Set(DAILY_VERSES.map((d) => d.id)).size).toBe(DAILY_VERSES.length);
    for (const d of DAILY_VERSES) assertValid(d.ref, web);
  });

  it("verse cards are unique and map to every installed edition (biblical accuracy)", async () => {
    expect(DAILY_VERSES.length).toBeGreaterThanOrEqual(365);
    expect(new Set(DAILY_VERSES.map((d) => d.ref)).size, "duplicate verse card").toBe(DAILY_VERSES.length);
    const problems: string[] = [];
    for (const d of DAILY_VERSES) {
      expect(d.phrase && d.phraseFr && d.phraseAr, `${d.id} reflections`).toBeTruthy();
      for (const e of others) {
        const m = await mapReference(parseRefKey(d.ref)!, "eng-web", e.id);
        if (!m.ref) problems.push(`${d.ref} → ${e.id}: ${m.status}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it("topic passages are valid", () => {
    for (const t of TOPICS) for (const p of t.passages) assertValid(p.ref, web);
  });

  it("every plan reading maps to every installed edition with matching numbering", async () => {
    const problems: string[] = [];
    for (const plan of PLANS)
      for (const day of plan.days)
        for (const r of day.refs)
          for (const e of others) {
            const m = await mapReference(parseRefKey(r)!, "eng-web", e.id);
            if (!m.ref) problems.push(`${plan.slug}: ${r} → ${e.id}: ${m.status}`);
          }
    expect(problems).toEqual([]);
  });

  it("every plan day has valid passages in every installed edition", () => {
    for (const plan of PLANS) {
      expect(plan.days.length).toBeGreaterThan(0);
      for (const day of plan.days) {
        expect(day.refs.length).toBeGreaterThan(0);
        for (const r of day.refs) {
          assertValid(r, web);
          // Plans use whole chapters or ranges in books every installed edition has.
          for (const e of others) expect(e.books.some((b) => b.id === parseRefKey(r)!.book), `${r} in ${e.id}`).toBe(true);
        }
      }
    }
  });
});
