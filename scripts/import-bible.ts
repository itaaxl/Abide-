/**
 * Imports complete public-domain Bible editions from eBible.org.
 *
 *   npm run bible:import            # all configured editions
 *   npm run bible:import -- eng-web # one edition
 *
 * For each edition it:
 *  1. downloads the official USFM and VPL archives (cached in .cache/sources),
 *  2. parses the USFM into per-chapter JSON (text, paragraph structure, notes),
 *  3. cross-checks every verse against the publisher's plain-text VPL export,
 *  4. writes data/bibles/<id>/{edition.json, corpus.json, chapters/...}
 *     and data/bibles/<id>/validation.json + docs/validation/<id>.md.
 *
 * The importer never rewrites Scripture wording. It only removes markup
 * (USFM markers, Strong's numbers) and separates footnotes from verse text.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import { ARABIC_BOOKS, collectionFor, ENGLISH_BOOKS } from "../src/lib/bible/canon";
import type { BookMeta, Chapter, CorpusRow, EditionMeta, Verse, VerseSegment } from "../src/lib/bible/types";

interface EditionConfig {
  id: string;
  sourceId: string;
  name: string;
  abbreviation: string;
  language: string;
  languageName: string;
  direction: "ltr" | "rtl";
  canonDescription: string;
  psalmTitles: EditionMeta["psalmTitles"];
  license: EditionMeta["license"];
  keepCrossReferences: boolean;
  /** Use a conventional short-name table instead of the source's own names. */
  shortNames?: Record<string, string[]>;
}

const EDITIONS: EditionConfig[] = [
  {
    id: "eng-web",
    sourceId: "eng-web",
    name: "World English Bible",
    abbreviation: "WEB",
    language: "en",
    languageName: "English",
    direction: "ltr",
    canonDescription:
      "Classic World English Bible with the full ecumenical book set: Old Testament, Deuterocanonical books/Apocrypha, and New Testament.",
    psalmTitles: "separate",
    license: {
      status: "Public Domain",
      summary:
        "The World English Bible is in the public domain. “World English Bible” is a trademark of eBible.org; the name may only be used for unaltered text, which this site preserves.",
      attribution: "World English Bible (WEB), public domain. eBible.org.",
      aiProcessingAllowed: true,
      redistributionAllowed: true,
      copyrightUrl: "https://ebible.org/eng-web/copyright.htm",
    },
    keepCrossReferences: true,
    shortNames: ENGLISH_BOOKS,
  },
  {
    id: "fra-lsg",
    sourceId: "fraLSG",
    name: "Louis Segond 1910",
    abbreviation: "LSG",
    language: "fr",
    languageName: "Français",
    direction: "ltr",
    canonDescription: "Protestant 66-book canon (Ancien et Nouveau Testament).",
    psalmTitles: "verse-one",
    license: {
      status: "Public Domain",
      summary:
        "La Bible Louis Segond 1910 est dans le domaine public (eBible.org). Only the 1910 Scripture text is imported; the 2011 editorial introductions and section headings in the source files are excluded.",
      attribution: "Louis Segond 1910 (LSG), domaine public. eBible.org.",
      aiProcessingAllowed: true,
      redistributionAllowed: true,
      copyrightUrl: "https://ebible.org/fraLSG/copyright.htm",
    },
    keepCrossReferences: false,
  },
  {
    id: "arb-vd",
    sourceId: "arb-vd",
    name: "الكتاب المقدس – فان دايك",
    abbreviation: "SVD",
    language: "ar",
    languageName: "العربية",
    direction: "rtl",
    canonDescription: "Protestant 66-book canon (Smith & Van Dyck Arabic translation).",
    shortNames: ARABIC_BOOKS,
    psalmTitles: "separate",
    license: {
      status: "Public Domain",
      summary:
        "The Smith & Van Dyck Arabic Bible is listed as public domain by eBible.org (contributor: American Bible Society). Editorial section headings in the source files are excluded.",
      attribution: "Smith & Van Dyck Arabic Bible, public domain. eBible.org.",
      aiProcessingAllowed: true,
      redistributionAllowed: true,
      copyrightUrl: "https://ebible.org/arb-vd/copyright.htm",
    },
    keepCrossReferences: false,
  },
];

const ROOT = path.resolve(__dirname, "..");
const CACHE = path.join(ROOT, ".cache", "sources");

async function download(url: string, dest: string): Promise<Buffer> {
  if (existsSync(dest)) return readFileSync(dest);
  mkdirSync(path.dirname(dest), { recursive: true });
  const res = await fetch(url, { headers: { "user-agent": "abide-bible-importer" } });
  if (!res.ok) throw new Error(`Download failed ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  return buf;
}

const sha256 = (b: Buffer) => createHash("sha256").update(b).digest("hex");

const PARAGRAPH_MARKERS = new Set([
  "p", "m", "mi", "pi", "pi1", "pi2", "pi3", "li", "li1", "li2", "li3", "q", "q1", "q2", "q3", "q4",
  "pc", "pm", "pmo", "pmc", "pmr", "qr", "qc", "qm", "qm1", "qm2", "nb", "cls", "ph", "ph1", "ph2",
  "tr",
]);
/** Markers whose content is editorial or titling, not verse text. */
const SKIP_CONTENT_MARKERS = new Set([
  "id", "ide", "h", "toc1", "toc2", "toc3", "toca1", "toca2", "toca3", "rem", "sts", "usfm",
  "mt", "mt1", "mt2", "mt3", "mt4", "mte", "mte1", "mte2", "ms", "ms1", "ms2", "ms3", "mr",
  "s", "s1", "s2", "s3", "s4", "sr", "r", "cl", "cd", "qa", "sd", "sd1",
  "imt", "imt1", "imt2", "imt3", "is", "is1", "is2", "ip", "ipi", "im", "imi", "ipq", "imq",
  "ipr", "iq", "iq1", "iq2", "ib", "ili", "ili1", "ili2", "iot", "io", "io1", "io2", "io3",
  "iex", "imte", "ie", "cp", "periph",
]);

function stripCharacterMarkup(s: string): string {
  // \w word|attrs\w*  and nested \+w ... \+w*
  s = s.replace(/\\\+?w\s+([^\\|]*?)(?:\|[^\\]*?)?\\\+?w\*/g, "$1");
  // Introduction outline references and other inline spans we drop entirely.
  s = s.replace(/\\ior\s.*?\\ior\*/g, "");
  // Generic character styles: keep content, drop markers.
  s = s.replace(
    /\\\+?(wj|wh|wg|wa|k|bk|qs|qac|nd|add|tl|sc|it|bd|bdit|em|ord|pn|png|sup|no|dc|lit|sls|fig|rq|ior|iqt|jmp|addpn)\*/g,
    "",
  );
  s = s.replace(
    /\\\+?(wj|wh|wg|wa|k|bk|qs|qac|nd|add|tl|sc|it|bd|bdit|em|ord|pn|png|sup|no|dc|lit|sls|rq|iqt|jmp|addpn) ?/g,
    "",
  );
  // Table cells: treat as text separators.
  s = s.replace(/\\t[hc]r?\d*(-\d+)? ?/g, " ");
  return s;
}

function noteText(body: string): string {
  return body
    .replace(/^[+\-?]\s*/, "")
    .replace(/\\(fr|xo)\s[^\\]*/g, "")
    .replace(/\\\+?[a-z]+\d*\*?\s?/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

interface ParsedBook {
  id: string;
  name: string;
  longName: string;
  chapters: Map<number, Chapter>;
  issues: string[];
}

function parseUsfm(src: string, editionId: string, keepXrefs: boolean): ParsedBook {
  const id = /\\id\s+([A-Z0-9]{3})/.exec(src)?.[1];
  if (!id) throw new Error("Missing \\id");
  const toc1 = /\\toc1\s+(.+)/.exec(src)?.[1]?.trim();
  const toc2 = /\\toc2\s+(.+)/.exec(src)?.[1]?.trim();
  const h = /\\h\s+(.+)/.exec(src)?.[1]?.trim();
  const issues: string[] = [];

  let body = stripCharacterMarkup(src.replace(/\r/g, ""));

  // Extract notes and replace them with sentinels so we know which verse owns them.
  const notes: { kind: "f" | "x"; text: string }[] = [];
  body = body.replace(/\\(f|fe|ef)\s([\s\S]*?)\\\1\*/g, (_m, _k, inner: string) => {
    notes.push({ kind: "f", text: noteText(inner) });
    return `\u0001${notes.length - 1}\u0001`;
  });
  body = body.replace(/\\(x|ex)\s([\s\S]*?)\\\1\*/g, (_m, _k, inner: string) => {
    const xt = /\\xt\s([\s\S]*?)(?:\\|$)/.exec(inner)?.[1] ?? noteText(inner);
    notes.push({ kind: "x", text: xt.replace(/\s+/g, " ").trim() });
    return `\u0001${notes.length - 1}\u0001`;
  });

  const chapters = new Map<number, Chapter>();
  let chapter: Chapter | null = null;
  let verse: Verse | null = null;
  let style = "p";
  let pendingBreak = true;
  let pendingStanza = false;
  let pendingSpeaker = "";
  let skipping = true; // before first \c, or inside headings

  const tokens = body.split(/(\\[a-z]+\d*(?:-\d+)?\*?)/);
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (!tok) continue;
    if (tok.startsWith("\\")) {
      const marker = tok.slice(1);
      if (marker === "c") {
        const content = tokens[i + 1] ?? "";
        const n = Number(/^\s*(\d+)/.exec(content)?.[1]);
        tokens[i + 1] = content.replace(/^\s*\d+/, "");
        chapter = { edition: editionId, book: id, chapter: n, verses: [] };
        if (chapters.has(n)) issues.push(`Duplicate chapter ${n}`);
        chapters.set(n, chapter);
        verse = null;
        pendingBreak = true;
        skipping = true; // text directly after \c N (e.g. trailing label) is not verse text
        continue;
      }
      if (marker === "v") {
        if (!chapter) {
          issues.push("Verse before chapter");
          continue;
        }
        const content = tokens[i + 1] ?? "";
        const m = /^\s*(\d+)(?:[a-z])?(?:-(\d+))?\s?/.exec(content);
        if (!m) {
          issues.push(`Unparseable verse marker in ${id} ${chapter.chapter}`);
          continue;
        }
        tokens[i + 1] = content.slice(m[0].length);
        verse = { v: Number(m[1]), t: "", segs: [] };
        if (m[2]) verse.ve = Number(m[2]);
        chapter.verses.push(verse);
        skipping = false;
        continue;
      }
      if (marker === "d") {
        // Psalm superscription. Before the first verse it is a chapter title.
        const content = (tokens[i + 1] ?? "").replace(/\s+/g, " ").trim();
        tokens[i + 1] = "";
        if (chapter && chapter.verses.length === 0) {
          const { text } = takeNotes(content, notes);
          chapter.title = chapter.title ? `${chapter.title} ${text}` : text;
        } else if (verse) {
          appendText(content, "d", true);
        }
        continue;
      }
      if (marker === "sp") {
        // Speaker label (Song of Songs). Editorial, kept as a label segment
        // that is rendered distinctly and excluded from the verse text.
        const content = (tokens[i + 1] ?? "").replace(/\s+/g, " ").trim();
        tokens[i + 1] = "";
        pendingSpeaker = content;
        pendingBreak = true;
        continue;
      }
      if (marker === "b") {
        pendingBreak = true;
        pendingStanza = true;
        continue;
      }
      if (PARAGRAPH_MARKERS.has(marker)) {
        if (marker !== "nb") {
          style = marker === "tr" ? "p" : marker.replace(/^q$/, "q1").replace(/^pi$/, "pi1").replace(/^li$/, "li1");
          pendingBreak = true;
        }
        skipping = !chapter || (chapter.verses.length === 0 && !verse);
        // A paragraph after \c but before \v still waits for the verse.
        if (verse) skipping = false;
        continue;
      }
      if (SKIP_CONTENT_MARKERS.has(marker) || marker.startsWith("i")) {
        tokens[i + 1] = (tokens[i + 1] ?? "").replace(/^[^\n]*/, "");
        continue;
      }
      if (marker.endsWith("*")) continue;
      issues.push(`Unhandled marker \\${marker}`);
      continue;
    }
    if (!skipping && verse) appendText(tok, style, false);
  }

  function takeNotes(text: string, all: typeof notes) {
    const own: { kind: "f" | "x"; text: string }[] = [];
    const clean = text.replace(/\u0001(\d+)\u0001/g, (_m, n: string) => {
      own.push(all[Number(n)]);
      return "";
    });
    return { text: clean.replace(/\s+/g, " ").trim(), own };
  }

  function appendText(raw: string, segStyle: string, forceNew: boolean) {
    if (!verse) return;
    const { text, own } = takeNotes(raw, notes);
    for (const n of own) {
      if (n.kind === "f") (verse.notes ??= []).push(n.text);
      else if (keepXrefs) (verse.xrefs ??= []).push(n.text);
    }
    if (!text) return;
    if (pendingSpeaker) {
      verse.segs.push({ t: pendingSpeaker, s: "sp", n: 1 });
      pendingSpeaker = "";
    }
    const last = verse.segs[verse.segs.length - 1];
    if (!last || pendingBreak || forceNew || last.s !== segStyle) {
      const seg: VerseSegment = { t: text, s: segStyle };
      if (pendingBreak || forceNew) seg.n = 1;
      if (pendingStanza) seg.b = 1;
      verse.segs.push(seg);
    } else {
      last.t = `${last.t} ${text}`;
    }
    pendingBreak = false;
    pendingStanza = false;
  }

  for (const ch of chapters.values()) {
    for (const v of ch.verses) {
      v.t = v.segs.filter((s) => s.s !== "sp").map((s) => s.t).join(" ").replace(/\s+/g, " ").replace(/\s+([,.;:!?’”»)\]])/g, "$1").trim();
      for (const s of v.segs) s.t = s.t.replace(/\s+([,.;:!?’”»)\]])/g, "$1").trim();
      if (v.segs.length === 0) v.segs = [];
    }
  }

  return { id, name: toc2 || h || id, longName: toc1 || toc2 || h || id, chapters, issues };
}

/** VPL rows keyed by "<vplBook> <ch>:<v>". */
function parseVpl(text: string) {
  const rows: { book: string; ch: number; v: number; text: string }[] = [];
  for (const line of text.replace(/^﻿/, "").split("\n")) {
    const m = /^(\S+) (\d+):(\d+) (.*)$/.exec(line.trimEnd());
    if (m) rows.push({ book: m[1], ch: Number(m[2]), v: Number(m[3]), text: m[4] });
  }
  return rows;
}

/** Comparison-only normalization (whitespace, bidi marks, space after em dash). */
const norm = (s: string) =>
  s.normalize("NFC").replace(/—\s+/g, "—").replace(/[‎‏‪-‮]/g, "").replace(/\s+/g, " ").replace(/\s+([,.;:!?’”»)\]])/g, "$1").trim();

async function importEdition(cfg: EditionConfig) {
  const base = `https://ebible.org/Scriptures/${cfg.sourceId}`;
  const usfmZip = await download(`${base}_usfm.zip`, path.join(CACHE, cfg.sourceId, "usfm.zip"));
  const vplZip = await download(`${base}_vpl.zip`, path.join(CACHE, cfg.sourceId, "vpl.zip"));

  const usfmFiles = unzipSync(new Uint8Array(usfmZip));
  const vplFiles = unzipSync(new Uint8Array(vplZip));
  const vplName = Object.keys(vplFiles).find((n) => n.endsWith("_vpl.txt"));
  if (!vplName) throw new Error("VPL text not found in archive");
  const vplRows = parseVpl(strFromU8(vplFiles[vplName]));

  const books: ParsedBook[] = [];
  for (const name of Object.keys(usfmFiles).sort((a, b) => parseInt(a) - parseInt(b))) {
    if (!/\.usfm$|\.sfm$/i.test(name)) continue;
    const src = strFromU8(usfmFiles[name]).replace(/^﻿/, "");
    if (!/\\c\s+1\b/.test(src)) continue; // front matter, glossary
    books.push(parseUsfm(src, cfg.id, cfg.keepCrossReferences));
  }

  // --- Validation -----------------------------------------------------------
  const report = {
    edition: cfg.id,
    generatedAt: new Date().toISOString(),
    source: { usfm: `${base}_usfm.zip`, vpl: `${base}_vpl.zip`, usfmSha256: sha256(usfmZip), vplSha256: sha256(vplZip) },
    bookCount: books.length,
    chapterCount: 0,
    verseCount: 0,
    vplVerseCount: vplRows.length,
    books: [] as { id: string; name: string; chapters: number; verses: number }[],
    duplicates: [] as string[],
    gaps: [] as string[],
    ordering: [] as string[],
    emptyVerses: [] as string[],
    parserIssues: [] as string[],
    vplComparison: { compared: 0, matched: 0, mismatches: [] as { ref: string; imported: string; vpl: string }[], missingInImport: [] as string[], missingInVpl: [] as string[] },
    passed: false,
  };

  // Map VPL books (which use their own codes) to USFM books by sequence.
  const vplBookOrder: string[] = [];
  for (const r of vplRows) if (vplBookOrder[vplBookOrder.length - 1] !== r.book) vplBookOrder.push(r.book);
  if (new Set(vplBookOrder).size !== vplBookOrder.length) report.ordering.push("VPL books are not contiguous");
  if (vplBookOrder.length !== books.length)
    report.ordering.push(`Book count differs: USFM ${books.length}, VPL ${vplBookOrder.length}`);
  const vplByKey = new Map<string, string>();
  for (const r of vplRows) {
    const idx = vplBookOrder.indexOf(r.book);
    const key = `${books[idx]?.id} ${r.ch}:${r.v}`;
    if (vplByKey.has(key)) report.duplicates.push(`VPL ${key}`);
    vplByKey.set(key, r.text);
  }

  const seenKeys = new Set<string>();
  for (const b of books) {
    let verseTotal = 0;
    const chNums = [...b.chapters.keys()];
    chNums.forEach((n, i) => {
      if (n !== i + 1) report.ordering.push(`${b.id}: chapter ${n} at position ${i + 1}`);
    });
    for (const ch of b.chapters.values()) {
      let expected = 1;
      for (const v of ch.verses) {
        const key = `${b.id} ${ch.chapter}:${v.v}`;
        if (seenKeys.has(key)) report.duplicates.push(key);
        seenKeys.add(key);
        if (v.v !== expected) report.gaps.push(`${b.id} ${ch.chapter}: expected v${expected}, found v${v.v}`);
        expected = (v.ve ?? v.v) + 1;
        if (!v.t) report.emptyVerses.push(`${key}${v.ve ? `-${v.ve}` : ""}${v.notes?.length ? ` (note: ${v.notes[0]})` : ""}`);
        verseTotal++;

        // Compare against VPL. WEB merges separately printed Psalm titles into verse 1.
        const vpl = vplByKey.get(key);
        let imported = v.segs.some((s, i) => i > 0 && s.s === "sp") ? v.segs.filter((s, i) => i > 0 || s.s !== "sp").map((s) => s.t).join(" ") : v.t;
        if (v.v === 1 && ch.title) imported = `${ch.title} ${imported}`;
        if (vpl === undefined) {
          if (v.t) report.vplComparison.missingInVpl.push(key);
          continue;
        }
        report.vplComparison.compared++;
        if (norm(imported) === norm(vpl)) report.vplComparison.matched++;
        else if (report.vplComparison.mismatches.length < 200)
          report.vplComparison.mismatches.push({ ref: key, imported, vpl });
      }
      report.chapterCount++;
    }
    report.verseCount += verseTotal;
    report.books.push({ id: b.id, name: b.name, chapters: b.chapters.size, verses: verseTotal });
    report.parserIssues.push(...b.issues.map((i) => `${b.id}: ${i}`));
  }
  for (const key of vplByKey.keys()) if (!seenKeys.has(key)) report.vplComparison.missingInImport.push(key);

  const mismatchCount = report.vplComparison.compared - report.vplComparison.matched;
  report.passed =
    report.duplicates.length === 0 &&
    report.ordering.length === 0 &&
    report.parserIssues.length === 0 &&
    report.vplComparison.missingInImport.length === 0 &&
    mismatchCount === 0;

  // --- Write output ---------------------------------------------------------
  const outDir = path.join(ROOT, "data", "bibles", cfg.id);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(path.join(outDir, "chapters"), { recursive: true });

  const bookMeta: BookMeta[] = books.map((b, order) => {
    const name = cfg.shortNames?.[b.id]?.[0] ?? b.name;
    return {
      id: b.id,
      name,
      longName: b.longName,
      collection: collectionFor(b.id),
      order,
      chapters: [...b.chapters.values()].map((c) => c.verses.reduce((m, v) => Math.max(m, v.ve ?? v.v), 0)),
    };
  });

  const corpus: CorpusRow[] = [];
  books.forEach((b, bi) => {
    mkdirSync(path.join(outDir, "chapters", b.id), { recursive: true });
    for (const ch of b.chapters.values()) {
      for (const v of ch.verses) {
        if (!v.notes?.length) delete v.notes;
        if (!v.xrefs?.length) delete v.xrefs;
        if (v.t) corpus.push([bi, ch.chapter, v.v, v.t]);
      }
      // Plain text is derived from segments at load time (see src/lib/bible/provider.ts).
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const stored = { ...ch, verses: ch.verses.map(({ t: _t, ...rest }) => rest) };
      writeFileSync(path.join(outDir, "chapters", b.id, `${ch.chapter}.json`), JSON.stringify(stored));
    }
  });

  const meta: EditionMeta = {
    id: cfg.id,
    name: cfg.name,
    abbreviation: cfg.abbreviation,
    language: cfg.language,
    languageName: cfg.languageName,
    direction: cfg.direction,
    canonDescription: cfg.canonDescription,
    psalmTitles: cfg.psalmTitles,
    license: cfg.license,
    source: {
      publisher: "eBible.org",
      url: `https://ebible.org/${cfg.sourceId}/`,
      usfmArchive: report.source.usfm,
      vplArchive: report.source.vpl,
      usfmSha256: report.source.usfmSha256,
      vplSha256: report.source.vplSha256,
      retrievedAt: report.generatedAt,
    },
    stats: { books: books.length, chapters: report.chapterCount, verses: report.verseCount },
    books: bookMeta,
  };
  writeFileSync(path.join(outDir, "edition.json"), JSON.stringify(meta, null, 1));
  writeFileSync(path.join(outDir, "corpus.json"), JSON.stringify(corpus));
  writeFileSync(path.join(outDir, "validation.json"), JSON.stringify(report, null, 1));

  const md = [
    `# Validation report: ${cfg.name} (${cfg.id})`,
    "",
    `Generated ${report.generatedAt} by \`npm run bible:import\`.`,
    "",
    `- Source USFM: ${report.source.usfm} (sha256 \`${report.source.usfmSha256}\`)`,
    `- Source VPL: ${report.source.vpl} (sha256 \`${report.source.vplSha256}\`)`,
    `- Books: **${report.bookCount}**, chapters: **${report.chapterCount}**, verse records: **${report.verseCount}** (VPL rows: ${report.vplVerseCount})`,
    `- Verses compared with publisher VPL text: ${report.vplComparison.compared}, exact matches: ${report.vplComparison.matched}, mismatches: ${mismatchCount}`,
    `- Missing in import (present in VPL): ${report.vplComparison.missingInImport.length}`,
    `- Duplicates: ${report.duplicates.length}; ordering problems: ${report.ordering.length}; parser issues: ${report.parserIssues.length}`,
    `- Numbering gaps (edition's own versification, informational): ${report.gaps.length}`,
    `- Empty verse records (verses the edition marks as omitted): ${report.emptyVerses.length}`,
    `- **Result: ${report.passed ? "PASSED" : "NEEDS REVIEW"}**`,
    "",
    "## Books",
    "",
    "| # | Code | Name | Chapters | Verses |",
    "|---|------|------|---------:|-------:|",
    ...report.books.map((b, i) => `| ${i + 1} | ${b.id} | ${b.name} | ${b.chapters} | ${b.verses} |`),
    "",
    ...(report.gaps.length ? ["## Numbering gaps", "", ...report.gaps.map((g) => `- ${g}`), ""] : []),
    ...(report.emptyVerses.length ? ["## Empty verse records", "", ...report.emptyVerses.map((g) => `- ${g}`), ""] : []),
    ...(mismatchCount
      ? ["## First mismatches", "", ...report.vplComparison.mismatches.slice(0, 20).map((m) => `- ${m.ref}\n  - imported: ${m.imported}\n  - vpl: ${m.vpl}`), ""]
      : []),
  ].join("\n");
  mkdirSync(path.join(ROOT, "docs", "validation"), { recursive: true });
  writeFileSync(path.join(ROOT, "docs", "validation", `${cfg.id}.md`), md);

  console.log(
    `${cfg.id}: ${report.bookCount} books, ${report.chapterCount} chapters, ${report.verseCount} verses; ` +
      `VPL match ${report.vplComparison.matched}/${report.vplComparison.compared}; ` +
      `missing ${report.vplComparison.missingInImport.length}; issues ${report.parserIssues.length}; ` +
      `${report.passed ? "PASSED" : "NEEDS REVIEW"}`,
  );
  return report;
}

async function main() {
  const only = process.argv.slice(2);
  const selected = only.length ? EDITIONS.filter((e) => only.includes(e.id)) : EDITIONS;
  let failed = false;
  for (const cfg of selected) {
    const r = await importEdition(cfg);
    if (!r.passed) failed = true;
  }
  writeFileSync(
    path.join(ROOT, "data", "bibles", "index.json"),
    JSON.stringify(
      EDITIONS.filter((e) => existsSync(path.join(ROOT, "data", "bibles", e.id, "edition.json"))).map((e) => e.id),
    ),
  );
  if (failed) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
