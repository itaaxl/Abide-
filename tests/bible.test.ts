/**
 * Tests run against the full imported datasets in data/bibles, not samples.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseReference, formatReference, refKey, parseRefKey } from "@/lib/bible/reference";
import { buildIndex, searchIndex, highlightParts } from "@/lib/bible/search-index";
import { foldText, tokenize } from "@/lib/bible/normalize";
import { getChapter, getVerses, listEditionIds } from "@/lib/bible/provider";
import type { CorpusRow, EditionMeta } from "@/lib/bible/types";

const load = (id: string) => ({
  edition: JSON.parse(readFileSync(path.join("data/bibles", id, "edition.json"), "utf8")) as EditionMeta,
  corpus: JSON.parse(readFileSync(path.join("data/bibles", id, "corpus.json"), "utf8")) as CorpusRow[],
  validation: JSON.parse(readFileSync(path.join("data/bibles", id, "validation.json"), "utf8")),
});

const web = load("eng-web");
const lsg = load("fra-lsg");
const svd = load("arb-vd");

describe("imported datasets", () => {
  it("lists all three editions", async () => {
    expect(await listEditionIds()).toEqual(["eng-web", "fra-lsg", "arb-vd"]);
  });

  it.each([
    [web, 81, 1402],
    [lsg, 66, 1189],
    [svd, 66, 1189],
  ])("edition %# has the complete book and chapter set and passed validation", (d, books, chapters) => {
    expect(d.edition.books).toHaveLength(books);
    expect(d.edition.stats.chapters).toBe(chapters);
    expect(d.validation.passed).toBe(true);
    expect(d.validation.vplComparison.matched).toBe(d.validation.vplComparison.compared);
  });

  it("has the Protestant 66 books in canonical order in every edition", () => {
    for (const d of [web, lsg, svd]) {
      const otnt = d.edition.books.filter((b) => b.collection !== "deuterocanon");
      expect(otnt).toHaveLength(66);
      expect(otnt[0].id).toBe("GEN");
      expect(otnt[38].id).toBe("MAL");
      expect(otnt[39].id).toBe("MAT");
      expect(otnt[65].id).toBe("REV");
    }
  });

  it("keeps WEB deuterocanonical books labelled as a separate collection", () => {
    const deut = web.edition.books.filter((b) => b.collection === "deuterocanon").map((b) => b.id);
    expect(deut).toEqual(expect.arrayContaining(["TOB", "JDT", "WIS", "SIR", "1MA", "2MA"]));
    expect(deut).toHaveLength(15);
  });

  it("reads exact Scripture wording", async () => {
    const [v] = (await getVerses("eng-web", "JHN", 3, 16))!;
    expect(v.t).toBe(
      "For God so loved the world, that he gave his only born Son, that whoever believes in him should not perish, but have eternal life.",
    );
    const ps = await getChapter("eng-web", "PSA", 3);
    expect(ps?.title).toBe("A Psalm by David, when he fled from Absalom his son.");
    expect(ps?.verses[0].t.startsWith("Yahweh, how my adversaries")).toBe(true);
    // LSG numbers the Psalm title as verse 1 — edition-specific numbering is preserved.
    const psFr = await getChapter("fra-lsg", "PSA", 3);
    expect(psFr?.verses[0].t).toContain("Psaume de David");
    expect(psFr?.verses).toHaveLength(9);
    expect(ps?.verses).toHaveLength(8);
  });

  it("returns null for missing chapters and unknown books", async () => {
    expect(await getChapter("eng-web", "JHN", 22)).toBeNull();
    expect(await getChapter("eng-web", "XXX", 1)).toBeNull();
    expect(await getChapter("fra-lsg", "TOB", 1)).toBeNull();
    expect(await getChapter("eng-web", "../etc", 1)).toBeNull();
  });
});

describe("reference parsing", () => {
  const e = web.edition;
  const ok = (s: string, edition = e) => {
    const r = parseReference(s, edition);
    if (!r.ok) throw new Error(`${s}: ${r.reason}`);
    return r.ref;
  };

  it("parses common formats", () => {
    expect(ok("John 3:16")).toEqual({ book: "JHN", chapter: 3, verse: 16 });
    expect(ok("John 3:16-18")).toEqual({ book: "JHN", chapter: 3, verse: 16, endVerse: 18 });
    expect(ok("Psalm 23")).toEqual({ book: "PSA", chapter: 23 });
    expect(ok("1 Corinthians 13")).toEqual({ book: "1CO", chapter: 13 });
    expect(ok("john 3 : 16")).toEqual({ book: "JHN", chapter: 3, verse: 16 });
    expect(ok("  JOHN   3:16  ")).toEqual({ book: "JHN", chapter: 3, verse: 16 });
    expect(ok("Jn 3.16")).toEqual({ book: "JHN", chapter: 3, verse: 16 });
    expect(ok("John 3:16–4:2")).toEqual({ book: "JHN", chapter: 3, verse: 16, endChapter: 4, endVerse: 2 });
    expect(ok("Romans")).toEqual({ book: "ROM", chapter: 1 });
    expect(ok("Psalms 23-24")).toEqual({ book: "PSA", chapter: 23, endChapter: 24 });
  });

  it("does not confuse numbered and similarly named books", () => {
    expect(ok("1 John 4:8").book).toBe("1JN");
    expect(ok("1john 4:8").book).toBe("1JN");
    expect(ok("I John 4:8").book).toBe("1JN");
    expect(ok("First John 4:8").book).toBe("1JN");
    expect(ok("John 4:8").book).toBe("JHN");
    expect(ok("3 John 1:4").book).toBe("3JN");
    expect(ok("Jude 1:3").book).toBe("JUD");
    expect(ok("Judges 6").book).toBe("JDG");
    expect(ok("Phil 4:13").book).toBe("PHP");
    expect(ok("Philemon 1:6").book).toBe("PHM");
    expect(ok("2 Kings 2").book).toBe("2KI");
    expect(ok("Song of Solomon 2:4").book).toBe("SNG");
  });

  it("validates bounds against the edition", () => {
    expect(parseReference("John 22:1", e)).toMatchObject({ ok: false, reason: "chapter-out-of-range" });
    expect(parseReference("John 3:37", e)).toMatchObject({ ok: false, reason: "verse-out-of-range", maxVerse: 36 });
    expect(parseReference("John 3:18-16", e)).toMatchObject({ ok: false, reason: "invalid-range" });
    expect(parseReference("Hezekiah 3:1", e)).toMatchObject({ ok: false, reason: "unknown-book" });
    expect(parseReference("love one another", e)).toMatchObject({ ok: false, reason: "not-reference" });
    expect(parseReference("Tobit 1:1", lsg.edition)).toMatchObject({ ok: false, reason: "book-not-in-edition" });
    expect(ok("Tobit 1:1").book).toBe("TOB");
  });

  it("supports French and Arabic book names and digits", () => {
    expect(ok("Jean 3:16", lsg.edition)).toEqual({ book: "JHN", chapter: 3, verse: 16 });
    expect(ok("Ésaïe 40:31", lsg.edition).book).toBe("ISA");
    expect(ok("esaie 40:31", lsg.edition).book).toBe("ISA");
    expect(ok("1 Jean 4:8", lsg.edition).book).toBe("1JN");
    expect(ok("Psaumes 23", lsg.edition).book).toBe("PSA");
    expect(ok("يوحنا ٣:١٦", svd.edition)).toEqual({ book: "JHN", chapter: 3, verse: 16 });
    expect(ok("المزامير 23", svd.edition).book).toBe("PSA");
    expect(ok("مزامير 23", svd.edition).book).toBe("PSA");
    expect(ok("1 يوحنا 4:8", svd.edition).book).toBe("1JN");
  });

  it("formats and round-trips keys", () => {
    const r = ok("John 3:16-18");
    expect(formatReference(r, e)).toBe("John 3:16–18");
    expect(refKey(r)).toBe("JHN.3.16-18");
    expect(parseRefKey("JHN.3.16-18")).toEqual(r);
    expect(parseRefKey("1CO.13")).toEqual({ book: "1CO", chapter: 13 });
    expect(parseRefKey("bad")).toBeNull();
  });
});

describe("search over the full corpus", () => {
  const idx = buildIndex(web.corpus);

  it("finds words and ranks phrase matches", () => {
    const r = searchIndex(idx, web.edition, "God so loved");
    expect(r.total).toBeGreaterThan(0);
    expect(r.hits[0]).toMatchObject({ book: "JHN", chapter: 3, verse: 16 });
  });

  it("supports exact phrase search", () => {
    const r = searchIndex(idx, web.edition, '"the Lord is my shepherd"');
    // WEB uses "Yahweh is my shepherd"; phrase search must not invent matches.
    expect(r.total).toBe(0);
    const r2 = searchIndex(idx, web.edition, '"Yahweh is my shepherd"');
    expect(r2.hits.map((h) => `${h.book} ${h.chapter}:${h.verse}`)).toEqual(["PSA 23:1"]);
  });

  it("paginates and filters by book and collection", () => {
    const all = searchIndex(idx, web.edition, "love", { pageSize: 10 });
    expect(all.total).toBeGreaterThan(300);
    expect(all.hits).toHaveLength(10);
    const p2 = searchIndex(idx, web.edition, "love", { pageSize: 10, page: 2 });
    expect(p2.hits[0]).not.toEqual(all.hits[0]);
    const inJohn = searchIndex(idx, web.edition, "love", { book: "1JN" });
    expect(inJohn.hits.every((h) => h.book === "1JN")).toBe(true);
    const nt = searchIndex(idx, web.edition, "love", { collection: "nt", sort: "canonical" });
    expect(nt.hits[0].book).toBe("MAT");
    expect(nt.total).toBeLessThan(all.total);
  });

  it("highlights without altering text", () => {
    const text = "For God so loved the world";
    const parts = highlightParts(text, new Set(["loved"]));
    expect(parts.map((p) => p.text).join("")).toBe(text);
    expect(parts.find((p) => p.match)?.text).toBe("loved");
  });

  it("searches French accent-insensitively and Arabic without diacritics", () => {
    const fr = searchIndex(buildIndex(lsg.corpus), lsg.edition, "eternel berger");
    expect(fr.hits.some((h) => h.book === "PSA" && h.chapter === 23 && h.verse === 1)).toBe(true);
    const ar = searchIndex(buildIndex(svd.corpus), svd.edition, "الراعي الصالح");
    expect(ar.hits.some((h) => h.book === "JHN" && h.chapter === 10 && h.verse === 11)).toBe(true);
  });

  it("returns no results for gibberish and empty input", () => {
    expect(searchIndex(idx, web.edition, "qwxzzy").total).toBe(0);
    expect(searchIndex(idx, web.edition, "   ").total).toBe(0);
  });

  it("normalizes text consistently", () => {
    expect(foldText("Éternel")).toBe("eternel");
    expect(tokenize("l’Éternel")).toEqual(["l", "eternel"]);
    expect(foldText("ٱللهِ")).toBe(foldText("الله"));
  });
});
