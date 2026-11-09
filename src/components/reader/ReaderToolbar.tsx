"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";
import { updatePrefs } from "@/app/actions/prefs";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Prefs } from "@/lib/prefs";

export interface ToolbarEdition {
  id: string;
  name: string;
  abbreviation: string;
  languageName: string;
}
export interface ToolbarBookGroup {
  label: string;
  books: { id: string; name: string; chapters: number }[];
}

interface Props {
  editions: ToolbarEdition[];
  edition: string;
  groups: ToolbarBookGroup[];
  book: string;
  chapter: number;
  prefs: Prefs;
  t: Dictionary["reader"];
  /** Books of other editions, to tell users when a book is missing. */
  bookAvailability: Record<string, string[]>;
}

export function ReaderToolbar({ editions, edition, groups, book, chapter, prefs, t, bookAvailability }: Props) {
  const router = useRouter();
  const [selBook, setSelBook] = useState(book);
  const [selChapter, setSelChapter] = useState(chapter);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [focus, setFocus] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const id = useId();

  const allBooks = groups.flatMap((g) => g.books);
  const chapters = allBooks.find((b) => b.id === selBook)?.chapters ?? 1;

  useEffect(() => {
    document.documentElement.toggleAttribute("data-focus", focus);
    return () => document.documentElement.removeAttribute("data-focus");
  }, [focus]);

  function go(b: string, c: number) {
    router.push(`/bible/${edition}/${b}/${c}`);
  }

  function changeEdition(next: string) {
    const available = bookAvailability[next] ?? [];
    startTransition(async () => {
      await updatePrefs({ edition: next });
      if (available.includes(book)) router.push(`/bible/${next}/${book}/${chapter}`);
      else {
        setNotice(`${allBooks.find((b) => b.id === book)?.name ?? book} is not included in that translation. Opening its first book instead.`);
        router.push(`/bible/${next}`);
      }
    });
  }

  function setPref(patch: Partial<Prefs>) {
    startTransition(async () => {
      await updatePrefs(patch);
      router.refresh();
    });
  }

  if (focus) {
    return (
      <div className="no-print fixed end-3 top-3 z-50">
        <button className="btn btn-sm shadow" onClick={() => setFocus(false)} autoFocus>
          {t.exitFocus}
        </button>
      </div>
    );
  }

  return (
    <div className="no-print mb-6 rounded-2xl border border-rule bg-surface/70 p-3">
      <div className="flex flex-wrap items-end gap-2 sm:gap-3">
        <div className="min-w-0 flex-1 sm:min-w-[11rem]">
          <label htmlFor={`${id}-ed`} className="label sr-only sm:not-sr-only">
            {t.translation}
          </label>
          <select id={`${id}-ed`} className="input" value={edition} onChange={(e) => changeEdition(e.target.value)} aria-describedby={`${id}-edh`}>
            {editions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.languageName} — {e.name} ({e.abbreviation})
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 sm:order-last">
          <button className="btn" aria-expanded={settingsOpen} aria-controls={`${id}-settings`} onClick={() => setSettingsOpen((o) => !o)}>
            <span aria-hidden="true">Aa</span> <span className="sr-only sm:not-sr-only">{t.settings}</span>
          </button>
          <button className="btn" onClick={() => setFocus(true)} title={t.focus}>
            <span aria-hidden="true">⤢</span> <span className="sr-only sm:not-sr-only">{t.focus}</span>
          </button>
        </div>
        <form
          className="flex basis-full items-end gap-2 sm:basis-0 sm:flex-[2]"
          onSubmit={(e) => {
            e.preventDefault();
            go(selBook, Math.min(selChapter, chapters));
          }}
        >
          <div className="min-w-0 flex-1">
            <label htmlFor={`${id}-bk`} className="label sr-only sm:not-sr-only">
              {t.book}
            </label>
            <select
              id={`${id}-bk`}
              className="input"
              value={selBook}
              aria-describedby={`${id}-bkh`}
              onChange={(e) => {
                setSelBook(e.target.value);
                setSelChapter(1);
              }}
            >
              {groups.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="w-20 shrink-0 sm:w-24">
            <label htmlFor={`${id}-ch`} className="label sr-only sm:not-sr-only">
              {t.chapter}
            </label>
            <select id={`${id}-ch`} className="input" value={selChapter} onChange={(e) => setSelChapter(Number(e.target.value))}>
              {Array.from({ length: chapters }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary">{t.go}</button>
        </form>
      </div>
      <details className="mt-2 hidden text-xs text-muted sm:block">
        <summary className="cursor-pointer">{t.translation} / {t.book}?</summary>
        <p id={`${id}-edh`} className="mt-1">{t.translationHelp}</p>
        <p id={`${id}-bkh`}>{t.bookHelp}</p>
      </details>
      {notice && (
        <p role="status" className="mt-2 text-sm text-danger">
          {notice}
        </p>
      )}

      {settingsOpen && (
        <div id={`${id}-settings`} className="mt-4 grid gap-4 border-t border-rule pt-4 sm:grid-cols-2 lg:grid-cols-3">
          <fieldset>
            <legend className="label">{t.theme}</legend>
            <div className="flex gap-2">
              {(["light", "sepia", "dark"] as const).map((th) => (
                <button key={th} className={`btn btn-sm ${prefs.theme === th ? "btn-primary" : ""}`} aria-pressed={prefs.theme === th} onClick={() => setPref({ theme: th })}>
                  {t[th]}
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor={`${id}-fs`} className="label">
              {t.fontSize}: {prefs.fontSize}px
            </label>
            <input id={`${id}-fs`} type="range" min={14} max={30} step={1} defaultValue={prefs.fontSize} className="w-full accent-[var(--gold)]" onChange={(e) => setPref({ fontSize: Number(e.target.value) })} />
          </div>
          <div>
            <label htmlFor={`${id}-lh`} className="label">
              {t.lineHeight}: {prefs.lineHeight.toFixed(2)}
            </label>
            <input id={`${id}-lh`} type="range" min={1.4} max={2.2} step={0.05} defaultValue={prefs.lineHeight} className="w-full accent-[var(--gold)]" onChange={(e) => setPref({ lineHeight: Number(e.target.value) })} />
          </div>
          <fieldset>
            <legend className="label">{t.width}</legend>
            <div className="flex gap-2">
              {(["narrow", "medium", "wide"] as const).map((w) => (
                <button key={w} className={`btn btn-sm ${prefs.width === w ? "btn-primary" : ""}`} aria-pressed={prefs.width === w} onClick={() => setPref({ width: w })}>
                  {t[w]}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label">{t.layout}</legend>
            <div className="flex gap-2">
              <button className={`btn btn-sm ${prefs.layout === "paragraph" ? "btn-primary" : ""}`} aria-pressed={prefs.layout === "paragraph"} onClick={() => setPref({ layout: "paragraph" })}>
                {t.paragraph}
              </button>
              <button className={`btn btn-sm ${prefs.layout === "verse" ? "btn-primary" : ""}`} aria-pressed={prefs.layout === "verse"} onClick={() => setPref({ layout: "verse" })}>
                {t.versePerLine}
              </button>
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={prefs.showNotes} onChange={(e) => setPref({ showNotes: e.target.checked })} className="h-5 w-5" />
              {t.notes}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={prefs.showVerseNumbers} onChange={(e) => setPref({ showVerseNumbers: e.target.checked })} className="h-5 w-5" />
              {t.verseNumbers}
            </label>
          </fieldset>
        </div>
      )}
    </div>
  );
}
