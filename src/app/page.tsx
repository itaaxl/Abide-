import Link from "next/link";
import { BookBrowser } from "@/components/BookBrowser";
import { ContinueReading } from "@/components/ContinueReading";
import { DailyVerseCard } from "@/components/DailyVerseCard";
import { PersonalSummary } from "@/components/PersonalSummary";
import { ReaderView } from "@/components/reader/ReaderView";
import { SearchBar } from "@/components/SearchBar";
import { TimezoneSync } from "@/components/TimezoneSync";
import { site } from "@/config/site";
import { getSessionUser } from "@/lib/auth";
import { getEdition } from "@/lib/bible/provider";
import { todayFor } from "@/lib/daily";
import { getDictionary, getPrefs } from "@/lib/request";
import { getReadingPosition } from "@/lib/user-data";

export default async function Home() {
  const [{ t, locale }, prefs, user, pos, today] = await Promise.all([
    getDictionary(),
    getPrefs(),
    getSessionUser(),
    getReadingPosition(),
    todayFor(),
  ]);
  const edition = (await getEdition(pos?.edition ?? prefs.edition)) ?? (await getEdition(site.defaultEdition))!;
  const start = edition.books.some((b) => b.id === site.startingPoint.book) ? site.startingPoint.book : edition.books[0].id;
  const current = pos && edition.books.some((b) => b.id === pos.book) ? { book: pos.book, chapter: pos.chapter } : { book: start, chapter: 1 };
  const startName = edition.books.find((b) => b.id === start)?.name ?? start;

  return (
    <>
      <TimezoneSync current={prefs.timezone} />
      <section className="border-b border-rule bg-surface/40">
        <div className="mx-auto max-w-4xl px-4 pb-10 pt-12 text-center">
          <h1 className="font-serif text-4xl leading-tight sm:text-5xl">{site.tagline}</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            The complete Bible in English, French and Arabic — free to read, no account needed.
          </p>
          <div className="mx-auto mt-6 max-w-2xl">
            <SearchBar t={t.search} edition={edition.id} large />
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {pos ? (
              <Link href={`/bible/${pos.edition}/${pos.book}/${pos.chapter}`} className="btn btn-primary">
                {t.reader.continue}: {edition.books.find((b) => b.id === pos.book)?.name} {pos.chapter}
              </Link>
            ) : (
              <ContinueReading label={t.reader.continue} fallbackLabel={`${t.reader.startHere}`} fallbackHref={`/bible/${edition.id}/${start}/1`} />
            )}
            <Link href={`/bible/${edition.id}`} className="btn">
              {t.reader.books}
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1.4fr_1fr]">
        <DailyVerseCard date={today.date} edition={prefs.edition} t={t} canSave={Boolean(user?.emailVerified)} />
        {user?.emailVerified ? (
          <PersonalSummary name={user.displayName} />
        ) : (
          <section className="card flex flex-col justify-between p-6">
            <div>
              <h2 className="font-serif text-2xl">New to the Bible?</h2>
              <p className="mt-2 text-muted">
                The Bible is a library of 66 books (more in some traditions). A good place to begin is the Gospel of {startName}, which tells the story of Jesus.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/guide" className="btn btn-sm">
                {t.footer.guide}
              </Link>
              <Link href="/plans/gospel-of-john" className="btn btn-sm">
                21-day plan
              </Link>
              <Link href="/discover" className="btn btn-sm">
                {t.nav.discover}
              </Link>
            </div>
          </section>
        )}
      </div>

      <div className="border-t border-rule">
        <ReaderView edition={edition} book={current.book} chapter={current.chapter} headingLevel="h2" />
      </div>

      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="all-books">
        <h2 id="all-books" className="mb-6 font-serif text-3xl">
          {t.reader.books} · <span className="text-muted">{edition.name}</span>
        </h2>
        <BookBrowser edition={edition} locale={locale} />
      </section>
    </>
  );
}
