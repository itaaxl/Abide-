"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState, useTransition } from "react";
import type { Chapter, Verse } from "@/lib/bible/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Prefs } from "@/lib/prefs";
import { copyText } from "@/lib/clipboard";
import {
  HIGHLIGHT_COLORS,
  HIGHLIGHT_LABELS,
  NOTE_MAX,
  type ChapterAnnotations,
  type HighlightColor,
} from "@/lib/annotations";
import { deleteNote, saveNote, saveReadingPosition, setHighlight, toggleBookmark } from "@/app/actions/annotations";
import { addPassageCard } from "@/app/actions/flashcards";

export interface ReaderProps {
  edition: { id: string; abbreviation: string; name: string; direction: "ltr" | "rtl"; language: string; attribution: string };
  bookName: string;
  chapter: Chapter;
  target: { from: number; to: number } | null;
  prefs: Pick<Prefs, "fontSize" | "lineHeight" | "width" | "layout" | "showNotes" | "showVerseNumbers">;
  t: Dictionary["reader"];
  /** null = guest (or auth unavailable). */
  annotations: ChapterAnnotations | null;
  canSave: boolean;
  savingHint: string | null;
}

const WIDTH_CLASS = { narrow: "max-w-[34rem]", medium: "max-w-[40rem]", wide: "max-w-[52rem]" } as const;

interface Piece {
  verse: Verse;
  text: string;
  first: boolean;
  speaker?: boolean;
}
interface Block {
  style: string;
  stanza: boolean;
  pieces: Piece[];
}

function buildBlocks(verses: Verse[], layout: "paragraph" | "verse"): Block[] {
  const blocks: Block[] = [];
  for (const verse of verses) {
    if (layout === "verse") {
      blocks.push({
        style: "p",
        stanza: false,
        pieces: [{ verse, text: verse.t || "—", first: true }],
      });
      continue;
    }
    if (verse.segs.length === 0) {
      // Verse the edition marks as omitted: keep its number visible.
      blocks[blocks.length - 1]?.pieces.push({ verse, text: "", first: true });
      continue;
    }
    verse.segs.forEach((seg, i) => {
      if (seg.s === "sp") {
        blocks.push({ style: "speaker", stanza: false, pieces: [{ verse, text: seg.t, first: false, speaker: true }] });
        return;
      }
      const newBlock = seg.n === 1 || blocks.length === 0 || blocks[blocks.length - 1].style === "speaker";
      if (newBlock) blocks.push({ style: seg.s, stanza: Boolean(seg.b), pieces: [] });
      const firstText = !verse.segs.slice(0, i).some((s) => s.s !== "sp");
      blocks[blocks.length - 1].pieces.push({ verse, text: seg.t, first: firstText });
    });
  }
  return blocks;
}

export function Reader(props: ReaderProps) {
  const { edition, chapter, bookName, prefs, t } = props;
  const [selected, setSelected] = useState<number[]>([]);
  const [annotations, setAnnotations] = useState<ChapterAnnotations | null>(props.annotations);
  const [status, setStatus] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const blocks = useMemo(() => buildBlocks(chapter.verses, prefs.layout), [chapter.verses, prefs.layout]);
  const notes = useMemo(
    () => chapter.verses.flatMap((v) => (v.notes ?? []).map((n, i) => ({ v: v.v, i, n }))),
    [chapter.verses],
  );
  const xrefs = useMemo(() => chapter.verses.filter((v) => v.xrefs?.length), [chapter.verses]);

  // Save reading position (guests: this device only).
  useEffect(() => {
    try {
      localStorage.setItem(
        "abide:last",
        JSON.stringify({ edition: edition.id, book: chapter.book, chapter: chapter.chapter, bookName, at: Date.now() }),
      );
    } catch {
      /* storage unavailable */
    }
  }, [edition.id, chapter.book, chapter.chapter, bookName]);

  // Signed-in users: one upsert per chapter actually read (after a short dwell), not per scroll.
  useEffect(() => {
    if (!props.canSave) return;
    const id = window.setTimeout(() => {
      void saveReadingPosition(edition.id, chapter.book, chapter.chapter);
    }, 4000);
    return () => window.clearTimeout(id);
  }, [props.canSave, edition.id, chapter.book, chapter.chapter]);

  useEffect(() => {
    if (props.target) document.getElementById(`v${props.target.from}`)?.scrollIntoView({ block: "center" });
  }, [props.target]);

  const sorted = [...selected].sort((a, b) => a - b);
  const range = sorted.length ? { from: sorted[0], to: sorted[sorted.length - 1] } : null;
  const refLabel = range
    ? `${bookName} ${chapter.chapter}:${range.from}${range.to !== range.from ? `–${range.to}` : ""}`
    : "";
  const refKey = range
    ? `${chapter.book}.${chapter.chapter}.${range.from}${range.to !== range.from ? `-${range.to}` : ""}`
    : "";

  const toggle = (v: number) =>
    setSelected((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  const flash = (msg: string) => {
    setStatus(msg);
    window.setTimeout(() => setStatus(null), 2500);
  };

  async function onCopy() {
    if (!range) return;
    const text = chapter.verses
      .filter((v) => v.v >= range.from && v.v <= range.to && v.t)
      .map((v) => (range.from === range.to ? v.t : `${v.v} ${v.t}`))
      .join(" ");
    const ok = await copyText(`${text}\n— ${refLabel} (${edition.abbreviation})\n${edition.attribution}`);
    flash(ok ? t.copied : t.copyFailed);
  }

  async function onShare() {
    if (!range) return;
    const url = `${window.location.origin}/p/${edition.id}/${refKey}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: refLabel, url });
        return;
      } catch {
        /* cancelled — fall back to copying */
      }
    }
    const ok = await copyText(url);
    flash(ok ? t.copied : t.copyFailed);
  }

  const bookmarkFor = (r: { from: number; to: number }) =>
    annotations?.bookmarks.find((b) => b.verseStart === r.from && b.verseEnd === r.to);

  function onBookmark() {
    if (!range || !annotations) return;
    const prev = annotations;
    const existing = bookmarkFor(range);
    setAnnotations({
      ...prev,
      bookmarks: existing
        ? prev.bookmarks.filter((b) => b !== existing)
        : [...prev.bookmarks, { id: "pending", verseStart: range.from, verseEnd: range.to }],
    });
    startTransition(async () => {
      const res = await toggleBookmark({
        edition: edition.id,
        book: chapter.book,
        chapter: chapter.chapter,
        verseStart: range.from,
        verseEnd: range.to,
      });
      if (!res.ok) {
        setAnnotations(prev); // roll back
        flash(res.error);
      } else if (res.data) {
        setAnnotations((cur) =>
          cur && {
            ...cur,
            bookmarks: cur.bookmarks.map((b) => (b.id === "pending" ? { ...b, id: res.data!.id } : b)),
          },
        );
      }
    });
  }

  function onHighlight(color: HighlightColor | null) {
    if (!annotations || !sorted.length) return;
    const prev = annotations;
    const next = { ...prev.highlights };
    for (const v of sorted) {
      if (color) next[v] = color;
      else delete next[v];
    }
    setAnnotations({ ...prev, highlights: next });
    startTransition(async () => {
      const res = await setHighlight({ edition: edition.id, book: chapter.book, chapter: chapter.chapter, verses: sorted, color });
      if (!res.ok) {
        setAnnotations(prev);
        flash(res.error);
      }
    });
  }

  const existingNote = range
    ? annotations?.notes.find((n) => n.verseStart === range.from && n.verseEnd === range.to)
    : undefined;

  function onSaveNote() {
    if (!range || !annotations || noteDraft === null) return;
    const body = noteDraft.trim();
    const prev = annotations;
    if (!body) return;
    startTransition(async () => {
      const res = await saveNote({
        id: existingNote?.id,
        edition: edition.id,
        book: chapter.book,
        chapter: chapter.chapter,
        verseStart: range.from,
        verseEnd: range.to,
        body,
      });
      if (!res.ok) {
        setAnnotations(prev);
        flash(res.error);
        return;
      }
      const saved = { id: res.data!.id, verseStart: range.from, verseEnd: range.to, body };
      setAnnotations((cur) => cur && { ...cur, notes: [...cur.notes.filter((n) => n.id !== saved.id), saved] });
      setNoteDraft(null);
      flash("✓");
    });
  }

  function onDeleteNote() {
    if (!existingNote || !annotations) return;
    const prev = annotations;
    setAnnotations({ ...prev, notes: prev.notes.filter((n) => n.id !== existingNote.id) });
    setNoteDraft(null);
    startTransition(async () => {
      const res = await deleteNote(existingNote.id);
      if (!res.ok) {
        setAnnotations(prev);
        flash(res.error);
      }
    });
  }

  function onFlashcard() {
    if (!range) return;
    startTransition(async () => {
      const res = await addPassageCard({
        edition: edition.id,
        book: chapter.book,
        chapter: chapter.chapter,
        verseStart: range.from,
        verseEnd: range.to,
      });
      flash(res.ok ? "✓ Flashcard added" : res.error);
    });
  }

  const notedVerses = new Set(annotations?.notes.flatMap((n) => range0(n.verseStart, n.verseEnd)) ?? []);
  const bookmarkedVerses = new Set(annotations?.bookmarks.flatMap((b) => range0(b.verseStart, b.verseEnd)) ?? []);

  const renderPiece = (p: Piece, key: string) => {
    if (p.speaker) return <span key={key}>{p.text}</span>;
    const v = p.verse.v;
    const hl = annotations?.highlights[v];
    const isTarget = props.target && v >= props.target.from && v <= props.target.to;
    const cls = ["verse", hl ? `hl-${hl}` : "", isTarget ? "target" : "", selected.includes(v) ? "selected" : ""].join(" ");
    return (
      <Fragment key={key}>
        {p.first && (
          <button
            type="button"
            id={`v${v}`}
            className={`verse-num scroll-mt-28 ${prefs.showVerseNumbers ? "" : "sr-only"}`}
            aria-pressed={selected.includes(v)}
            aria-label={`${t.verse} ${v}`}
            onClick={() => toggle(v)}
          >
            {p.verse.ve ? `${v}–${p.verse.ve}` : v}
            {bookmarkedVerses.has(v) && <span aria-label={t.bookmarked}>•</span>}
          </button>
        )}
        <span
          className={cls}
          data-verse={v}
          onClick={() => toggle(v)}
        >
          {p.text}
          {p.first && prefs.showNotes && p.verse.notes?.length ? (
            <a href={`#fn-${v}-0`} className="note-mark" aria-label={`${t.footnotes} ${v}`}>
              †
            </a>
          ) : null}
          {notedVerses.has(v) && p.first ? (
            <span className="note-mark" aria-label={t.note}>
              ✎
            </span>
          ) : null}
        </span>{" "}
      </Fragment>
    );
  };

  return (
    <div>
      <article
        dir={edition.direction}
        lang={edition.language}
        className={`scripture chapter-enter mx-auto ${WIDTH_CLASS[prefs.width]}`}
        style={{ ["--reader-size" as string]: `${prefs.fontSize}px`, ["--reader-leading" as string]: prefs.lineHeight }}
        aria-label={`${bookName} ${chapter.chapter}`}
      >
        {chapter.title && <p className="mb-4 text-[0.92em] italic text-muted">{chapter.title}</p>}
        {blocks.map((b, bi) => {
          const cls = b.style === "speaker" ? "speaker" : /^q\d/.test(b.style) ? b.style : b.style.startsWith("pi") || b.style.startsWith("li") ? "q1" : "";
          if (b.style === "speaker") return <p key={bi} className="speaker">{b.pieces[0].text}</p>;
          return (
            <p key={bi} className={`${cls} ${b.stanza ? "stanza" : ""}`}>
              {b.pieces.map((p, pi) => renderPiece(p, `${bi}-${pi}`))}
            </p>
          );
        })}
      </article>

      {(prefs.showNotes && notes.length > 0) || xrefs.length > 0 ? (
        <aside className={`mx-auto mt-10 border-t border-rule pt-6 text-sm text-muted ${WIDTH_CLASS[prefs.width]}`} dir={edition.direction}>
          {prefs.showNotes && notes.length > 0 && (
            <>
              <h2 className="eyebrow mb-3">{t.footnotes}</h2>
              <ol className="space-y-2">
                {notes.map((n) => (
                  <li key={`${n.v}-${n.i}`} id={`fn-${n.v}-${n.i}`} className="scroll-mt-28">
                    <a href={`#v${n.v}`} className="me-2 font-semibold text-gold">
                      {chapter.chapter}:{n.v}
                    </a>
                    {n.n}
                  </li>
                ))}
              </ol>
            </>
          )}
          {xrefs.length > 0 && (
            <details className="mt-6">
              <summary className="eyebrow cursor-pointer">{t.crossRefs}</summary>
              <ul className="mt-3 space-y-1">
                {xrefs.map((v) => (
                  <li key={v.v}>
                    <span className="me-2 font-semibold">{chapter.chapter}:{v.v}</span>
                    {v.xrefs!.map((x, i) => (
                      <Link key={i} className="me-3 underline" href={`/search?q=${encodeURIComponent(x)}&edition=${edition.id}`}>
                        {x}
                      </Link>
                    ))}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs">Cross-references are part of the World English Bible source files.</p>
            </details>
          )}
        </aside>
      ) : null}

      {/* Verse action bar */}
      {range && (
        <div
          role="region"
          aria-label={refLabel}
          className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-surface/97 shadow-[0_-4px_20px_rgb(0_0_0/0.06)]"
        >
          <div className="mx-auto max-w-3xl px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="font-serif text-lg">
                {refLabel} <span className="text-sm text-muted">{edition.abbreviation}</span>
              </p>
              <button className="btn btn-sm btn-ghost" onClick={() => { setSelected([]); setNoteDraft(null); }}>
                {t.clear}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button className="btn btn-sm" onClick={onCopy}>{t.copy}</button>
              <button className="btn btn-sm" onClick={onShare}>{t.share}</button>
              {props.canSave && annotations ? (
                <>
                  <button className="btn btn-sm" onClick={onBookmark} aria-pressed={Boolean(bookmarkFor(range))} disabled={pending}>
                    {bookmarkFor(range) ? `★ ${t.bookmarked}` : `☆ ${t.bookmark}`}
                  </button>
                  <div role="group" aria-label={t.highlight} className="flex items-center gap-1">
                    {HIGHLIGHT_COLORS.map((c) => (
                      <button
                        key={c}
                        className={`hl-${c} h-9 w-9 rounded-full border border-rule`}
                        title={`${t.highlight}: ${HIGHLIGHT_LABELS[c]}`}
                        aria-label={`${t.highlight}: ${HIGHLIGHT_LABELS[c]}`}
                        onClick={() => onHighlight(c)}
                      />
                    ))}
                    <button className="btn btn-sm btn-ghost" onClick={() => onHighlight(null)} aria-label={`${t.highlight}: ${t.clear}`}>
                      ⌫
                    </button>
                  </div>
                  <button className="btn btn-sm" onClick={() => setNoteDraft(existingNote?.body ?? "")}>✎ {t.note}</button>
                  <button className="btn btn-sm" onClick={onFlashcard} disabled={pending}>{t.flashcard}</button>
                </>
              ) : (
                props.savingHint && (
                  <Link href="/auth/sign-in" className="text-sm text-muted underline">
                    {props.savingHint}
                  </Link>
                )
              )}
            </div>
            {noteDraft !== null && (
              <div className="mt-3">
                <label htmlFor="note" className="label">
                  {t.note} · <span className="text-muted">🔒 Private</span>
                </label>
                <textarea
                  id="note"
                  className="input min-h-24"
                  maxLength={NOTE_MAX}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                />
                <div className="mt-2 flex items-center gap-2">
                  <button className="btn btn-sm btn-primary" onClick={onSaveNote} disabled={pending || !noteDraft.trim()}>
                    Save
                  </button>
                  {existingNote && (
                    <button className="btn btn-sm btn-danger" onClick={onDeleteNote} disabled={pending}>
                      Delete
                    </button>
                  )}
                  <button className="btn btn-sm btn-ghost" onClick={() => setNoteDraft(null)}>Cancel</button>
                  <span className="ms-auto text-xs text-muted">{noteDraft.length}/{NOTE_MAX}</span>
                </div>
              </div>
            )}
            <p role="status" aria-live="polite" className="min-h-5 pt-1 text-sm text-success">
              {status}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function range0(a: number, b: number) {
  const out: number[] = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}
