import { describe, expect, it } from "vitest";
import { mapReference } from "@/lib/bible/mapping";
import { clozeIndices } from "@/lib/flashcards";

describe("cross-edition mapping", () => {
  it("keeps identical numbering, shifts Psalm titles, and refuses to guess otherwise", async () => {
    expect(await mapReference({ book: "JHN", chapter: 3, verse: 16 }, "eng-web", "fra-lsg")).toEqual({
      ref: { book: "JHN", chapter: 3, verse: 16 },
      status: "same",
    });
    // WEB Psalm 3:1 (title printed separately) is LSG Psalm 3:2 (title is verse 1).
    expect(await mapReference({ book: "PSA", chapter: 3, verse: 1 }, "eng-web", "fra-lsg")).toEqual({
      ref: { book: "PSA", chapter: 3, verse: 2 },
      status: "psalm-title-offset",
    });
    // LSG keeps short titles inside verse 1 (Psalm 23 has 6 verses in both), so numbering is identical.
    expect((await mapReference({ book: "PSA", chapter: 23, verse: 1 }, "eng-web", "fra-lsg")).status).toBe("same");
    // Exodus 8 numbering differs (WEB 32 verses, LSG 28): never guess a verse.
    expect(await mapReference({ book: "EXO", chapter: 8, verse: 20 }, "eng-web", "fra-lsg")).toEqual({ ref: null, status: "unmapped" });
    expect((await mapReference({ book: "TOB", chapter: 1, verse: 1 }, "eng-web", "arb-vd")).status).toBe("missing-book");
  });
});

describe("cloze generation", () => {
  const words = "For God so loved the world, that he gave his only born Son".split(" ");
  it("is deterministic per card and hides only real words", () => {
    const a = clozeIndices(words, "card-1");
    expect(clozeIndices(words, "card-1")).toEqual(a);
    expect(a.length).toBeGreaterThan(0);
    for (const i of a) expect(words[i].replace(/[^\p{L}]/gu, "").length).toBeGreaterThanOrEqual(4);
    // The answer is the original text: indices only, words untouched.
    expect(words.join(" ")).toBe("For God so loved the world, that he gave his only born Son");
  });
});
