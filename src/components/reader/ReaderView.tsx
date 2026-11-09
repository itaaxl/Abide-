import Link from "next/link";
import { getChapter, getEdition, listEditions } from "@/lib/bible/provider";
import { adjacentChapters, groupBooks } from "@/lib/bible/navigation";
import type { EditionMeta } from "@/lib/bible/types";
import { getSessionUser } from "@/lib/auth";
import { getDictionary, getPrefs } from "@/lib/request";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getChapterAnnotations } from "@/lib/user-data";
import { Reader } from "./Reader";
import { ReaderToolbar } from "./ReaderToolbar";
import { ParallelColumn } from "./ParallelColumn";
import { FocusMode } from "./FocusMode";

interface Props {
  edition: EditionMeta;
  book: string;
  chapter: number;
  target?: { from: number; to: number } | null;
  parallel?: string | null;
  headingLevel?: "h1" | "h2";
}

export async function ReaderView({ edition, book, chapter, target = null, parallel = null, headingLevel = "h1" }: Props) {
  const [{ t, locale }, prefs, data, editions, user] = await Promise.all([
    getDictionary(),
    getPrefs(),
    getChapter(edition.id, book, chapter),
    listEditions(),
    getSessionUser(),
  ]);
  const bookMeta = edition.books.find((b) => b.id === book);
  const groups = groupBooks(edition, locale).map((g) => ({
    label: g.label,
    books: g.books.map((b) => ({ id: b.id, name: b.name, chapters: b.chapters.length })),
  }));
  const bookAvailability = Object.fromEntries(editions.map((e) => [e.id, e.books.map((b) => b.id)]));
  const toolbarEditions = editions.map((e) => ({ id: e.id, name: e.name, abbreviation: e.abbreviation, languageName: e.languageName }));
  const H = headingLevel;

  if (!data || !bookMeta) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10">
        <ReaderToolbar editions={toolbarEditions} edition={edition.id} groups={groups} book={edition.books[0].id} chapter={1} prefs={prefs} t={t.reader} bookAvailability={bookAvailability} />
        <div role="alert" className="card p-6">
          <p className="font-serif text-xl">{t.reader.missingChapter}</p>
          <p className="mt-2 text-muted">
            {book} {chapter} · {edition.name}
          </p>
          <div className="mt-4 flex gap-2">
            <Link className="btn" href={`/bible/${edition.id}`}>
              {t.reader.books}
            </Link>
            <Link className="btn" href={`/search?edition=${edition.id}`}>
              {t.search.submit}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const { prev, next } = adjacentChapters(edition, book, chapter);
  const annotations = await getChapterAnnotations(edition.id, book, chapter);
  const authAvailable = isSupabaseConfigured();
  const parallelEdition = parallel && parallel !== edition.id ? await getEdition(parallel) : null;

  return (
    <section className={`mx-auto px-4 pb-40 pt-6 ${parallelEdition ? "max-w-6xl" : "max-w-4xl"}`} aria-labelledby="chapter-heading">
      <ReaderToolbar
        key={`${edition.id}-${book}-${chapter}`}
        editions={toolbarEditions}
        edition={edition.id}
        groups={groups}
        book={book}
        chapter={chapter}
        prefs={prefs}
        t={t.reader}
        bookAvailability={bookAvailability}
      />

      <header className="relative mb-8 text-center">
        <div className="mb-3 flex justify-end">
          <FocusMode label={t.reader.focus} exitLabel={t.reader.exitFocus} />
        </div>
        <p className="eyebrow reader-secondary">{edition.name}</p>
        <H id="chapter-heading" className="mt-1 font-serif text-3xl font-medium tracking-tight sm:text-[2.4rem]" dir={edition.direction}>
          {bookMeta.name} <span className="text-gold">{chapter}</span>
        </H>
        {chapter === 1 && bookMeta.longName !== bookMeta.name && (
          <p className="reader-secondary mt-2 font-serif italic text-muted" dir={edition.direction}>
            {bookMeta.longName}
          </p>
        )}
        <div className="rule-ornament reader-secondary mx-auto mt-5 max-w-xs" aria-hidden="true">
          ✦
        </div>
      </header>

      <div className={parallelEdition ? "grid gap-8 lg:grid-cols-2" : ""}>
        <Reader
          key={`${edition.id}-${book}-${chapter}`}
          edition={{
            id: edition.id,
            abbreviation: edition.abbreviation,
            name: edition.name,
            direction: edition.direction,
            language: edition.language,
            attribution: edition.license.attribution,
          }}
          bookName={bookMeta.name}
          chapter={data}
          target={target}
          prefs={prefs}
          t={t.reader}
          annotations={annotations}
          canSave={Boolean(annotations)}
          savingHint={authAvailable ? (user && !user.emailVerified ? "Verify your email to save." : t.reader.signInToSave) : null}
        />
        {parallelEdition && (
          <ParallelColumn primary={edition} secondary={parallelEdition} book={book} chapter={chapter} prefs={prefs} />
        )}
      </div>

      <nav aria-label="Chapter navigation" className="reader-secondary mx-auto mt-12 flex max-w-2xl items-center justify-between gap-3 border-t border-rule pt-6">
        {prev ? (
          <Link prefetch rel="prev" href={`/bible/${edition.id}/${prev.book}/${prev.chapter}`} className="btn">
            <span aria-hidden="true">{edition.direction === "rtl" ? "→" : "←"}</span>
            <span>
              <span className="sr-only">{t.reader.prevChapter}: </span>
              {prev.bookName} {prev.chapter}
            </span>
          </Link>
        ) : (
          <span />
        )}
        <ParallelPicker editions={editions.filter((e) => e.id !== edition.id)} current={parallel} base={`/bible/${edition.id}/${book}/${chapter}`} label={t.reader.parallel} />
        {next ? (
          <Link prefetch rel="next" href={`/bible/${edition.id}/${next.book}/${next.chapter}`} className="btn">
            <span>
              <span className="sr-only">{t.reader.nextChapter}: </span>
              {next.bookName} {next.chapter}
            </span>
            <span aria-hidden="true">{edition.direction === "rtl" ? "←" : "→"}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
      <p className="reader-secondary mt-6 text-center text-xs text-muted">
        {edition.license.attribution}{" "}
        <Link href="/editions" className="underline">
          {t.footer.editions}
        </Link>
      </p>
    </section>
  );
}

function ParallelPicker({ editions, current, base, label }: { editions: EditionMeta[]; current: string | null; base: string; label: string }) {
  return (
    <details className="relative text-sm">
      <summary className="btn btn-sm cursor-pointer list-none">{label}</summary>
      <ul className="card absolute bottom-12 start-1/2 z-20 w-64 -translate-x-1/2 p-2">
        {editions.map((e) => (
          <li key={e.id}>
            <Link href={`${base}?parallel=${e.id}`} className="block rounded px-3 py-2 hover:bg-gold-soft/40" aria-current={current === e.id}>
              {e.languageName} — {e.abbreviation}
            </Link>
          </li>
        ))}
        {current && (
          <li>
            <Link href={base} className="block rounded px-3 py-2 text-muted hover:bg-gold-soft/40">
              ✕
            </Link>
          </li>
        )}
      </ul>
    </details>
  );
}
