import Link from "next/link";
import { BookBrowser } from "@/components/BookBrowser";
import { ContinueReading } from "@/components/ContinueReading";
import { ReaderView } from "@/components/reader/ReaderView";
import { SearchBar } from "@/components/SearchBar";
import { TimezoneSync } from "@/components/TimezoneSync";
import { site } from "@/config/site";
import { getEdition } from "@/lib/bible/provider";
import { getDictionary, getPrefs } from "@/lib/request";
import { getReadingPosition } from "@/lib/user-data";

export default async function Home() {
  const [{ t, locale }, prefs, pos] = await Promise.all([getDictionary(), getPrefs(), getReadingPosition()]);
  const edition = (await getEdition(pos?.edition ?? prefs.edition)) ?? (await getEdition(site.defaultEdition))!;
  const start = edition.books.some((b) => b.id === site.startingPoint.book) ? site.startingPoint.book : edition.books[0].id;
  const current = pos && edition.books.some((b) => b.id === pos.book) ? { book: pos.book, chapter: pos.chapter } : { book: start, chapter: 1 };

  return (
    <>
      <TimezoneSync current={prefs.timezone} />
      <section className="mx-auto max-w-2xl px-4 pb-6 pt-7">
        <h1 className="text-[1.65rem] font-bold leading-tight tracking-[-0.02em] sm:text-3xl">{t.home.tagline}</h1>
        <p className="mt-1.5 text-muted">{t.home.intro}</p>
        <div className="mt-5">
          <SearchBar t={t.search} edition={edition.id} large />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {pos ? (
            <Link href={`/bible/${pos.edition}/${pos.book}/${pos.chapter}`} className="btn btn-primary">
              {t.reader.continue}: {edition.books.find((b) => b.id === pos.book)?.name} {pos.chapter}
            </Link>
          ) : (
            <ContinueReading label={t.reader.continue} fallbackLabel={t.reader.startHere} fallbackHref={`/bible/${edition.id}/${start}/1`} />
          )}
          <Link href="/flashcards" className="btn">
            <span aria-hidden="true" className="text-warm">✦</span> {t.cards.today}
          </Link>
        </div>
      </section>

      <div className="border-t border-rule">
        <ReaderView edition={edition} book={current.book} chapter={current.chapter} headingLevel="h2" />
      </div>

      <section className="mx-auto max-w-5xl px-4 py-10" aria-labelledby="all-books">
        <h2 id="all-books" className="mb-5 text-xl font-bold tracking-tight">
          {t.reader.books} <span className="font-normal text-muted">· {edition.name}</span>
        </h2>
        <BookBrowser edition={edition} locale={locale} />
      </section>
    </>
  );
}
