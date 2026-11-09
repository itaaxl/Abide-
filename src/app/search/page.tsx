import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import { site } from "@/config/site";
import type { Collection } from "@/lib/bible/canon";
import { groupBooks } from "@/lib/bible/navigation";
import { getEdition, listEditions } from "@/lib/bible/provider";
import { parseReference, passageHref } from "@/lib/bible/reference";
import { searchBible } from "@/lib/bible/search";
import { getDictionary, getPrefs } from "@/lib/request";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const { t, locale } = await getDictionary();
  const prefs = await getPrefs();
  const q = (str(sp.q) ?? "").trim().slice(0, 200);
  const editionId = str(sp.edition) ?? prefs.edition;
  const edition = (await getEdition(editionId)) ?? (await getEdition(site.defaultEdition))!;
  const book = str(sp.book);
  const collection = str(sp.collection) as Collection | undefined;
  const sort = str(sp.sort) === "canonical" ? "canonical" : "relevance";
  const page = Math.max(1, Math.min(500, Number(str(sp.page)) || 1));
  const wordsOnly = str(sp.mode) === "words";

  // Reference lookup first: "John 3:16" opens the passage directly.
  let refNotice: React.ReactNode = null;
  if (q && !wordsOnly) {
    const parsed = parseReference(q, edition);
    const hasDigit = /\d|[٠-٩]/.test(q);
    if (parsed.ok && hasDigit) redirect(passageHref(edition.id, parsed.ref));
    if (parsed.ok && !hasDigit) {
      refNotice = (
        <p className="card p-4">
          Open the book of{" "}
          <Link className="font-semibold underline" href={`/bible/${edition.id}/${parsed.book.id}`}>
            {parsed.book.name}
          </Link>
          , or see verses containing “{q}” below.
        </p>
      );
    } else if (!parsed.ok && parsed.reason === "verse-out-of-range") {
      refNotice = (
        <p role="alert" className="card p-4">
          {parsed.book.name} {parsed.chapter} has {parsed.maxVerse} verses in {edition.abbreviation}, so verse {parsed.verse} does not exist.{" "}
          <Link className="underline" href={`/bible/${edition.id}/${parsed.book.id}/${parsed.chapter}`}>
            Open {parsed.book.name} {parsed.chapter}
          </Link>
        </p>
      );
    } else if (!parsed.ok && parsed.reason === "chapter-out-of-range") {
      refNotice = (
        <p role="alert" className="card p-4">
          {parsed.book.name} has {parsed.book.chapters.length} chapters in {edition.abbreviation}; there is no chapter {parsed.chapter}.{" "}
          <Link className="underline" href={`/bible/${edition.id}/${parsed.book.id}`}>
            Choose a chapter
          </Link>
        </p>
      );
    } else if (!parsed.ok && parsed.reason === "invalid-range") {
      refNotice = <p role="alert" className="card p-4">That verse range runs backwards or past the end of the chapter. Try a range like John 3:16–18.</p>;
    } else if (!parsed.ok && parsed.reason === "book-not-in-edition") {
      const other = (await listEditions()).find((e) => e.books.some((b) => b.id === parsed.book));
      refNotice = (
        <p role="alert" className="card p-4">
          That book is not part of {edition.name}.{" "}
          {other && (
            <Link className="underline" href={`/search?q=${encodeURIComponent(q)}&edition=${other.id}`}>
              Look it up in {other.name}
            </Link>
          )}
        </p>
      );
    } else if (!parsed.ok && parsed.reason === "unknown-book") {
      refNotice = (
        <p role="alert" className="card p-4">
          We couldn’t find a book called “{parsed.bookText}”. Check the spelling, or browse{" "}
          <Link className="underline" href={`/bible/${edition.id}`}>
            all books
          </Link>
          . Showing word matches instead.
        </p>
      );
    }
  }

  const result = q ? await searchBible(edition.id, q, { book, collection, sort, page, pageSize: 20 }) : null;
  const groups = groupBooks(edition, locale);
  const qs = (patch: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const base = { q, edition: edition.id, book, collection, sort: sort === "canonical" ? "canonical" : undefined, mode: wordsOnly ? "words" : undefined, ...patch };
    for (const [k, v] of Object.entries(base)) if (v !== undefined && v !== "") p.set(k, String(v));
    return `/search?${p.toString()}`;
  };
  const totalPages = result ? Math.ceil(result.total / result.pageSize) : 0;
  const filtered = Boolean(book || collection);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">{t.search.label}</h1>
      <SearchBar t={t.search} edition={edition.id} defaultValue={q} large />
      <p className="mt-2 text-sm text-muted">
        {edition.name} ({edition.abbreviation}) · {t.search.phraseTip}{" "}
        <Link className="underline" href={`/bible/${edition.id}`}>
          {t.reader.translation}
        </Link>
      </p>

      {refNotice && <div className="mt-6">{refNotice}</div>}

      {q && result && (
        <>
          <form method="get" action="/search" className="mt-6 flex flex-wrap items-end gap-3 border-y border-rule py-4" aria-label={t.search.filters}>
            <input type="hidden" name="q" value={q} />
            <input type="hidden" name="edition" value={edition.id} />
            {wordsOnly && <input type="hidden" name="mode" value="words" />}
            <div>
              <label htmlFor="collection" className="label">
                {t.search.filters}
              </label>
              <select id="collection" name="collection" defaultValue={collection ?? ""} className="input">
                <option value="">{t.search.allCollections}</option>
                {groups.map((g) => (
                  <option key={g.collection} value={g.collection}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="book" className="label">
                {t.reader.book}
              </label>
              <select id="book" name="book" defaultValue={book ?? ""} className="input">
                <option value="">{t.search.allBooks}</option>
                {result.bookCounts.map((bc) => (
                  <option key={bc.book} value={bc.book}>
                    {edition.books.find((b) => b.id === bc.book)?.name} ({bc.count})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sort" className="label">
                Sort
              </label>
              <select id="sort" name="sort" defaultValue={sort} className="input">
                <option value="relevance">{t.search.relevance}</option>
                <option value="canonical">{t.search.canonical}</option>
              </select>
            </div>
            <button className="btn">{t.search.submit}</button>
            {filtered && (
              <Link href={qs({ book: undefined, collection: undefined, page: undefined })} className="btn btn-ghost">
                {t.search.reset}
              </Link>
            )}
          </form>

          <p className="mt-4 text-sm text-muted" role="status">
            {result.total.toLocaleString(locale)} {t.search.results}
            {totalPages > 1 && ` · ${page}/${totalPages}`}
          </p>

          {result.total === 0 ? (
            <div className="card mt-4 p-6">
              <p className="font-serif text-xl">{t.search.noResults}</p>
              <p className="mt-2 text-muted">{t.search.noResultsHint}</p>
              {filtered && (
                <Link className="mt-3 inline-block underline" href={qs({ book: undefined, collection: undefined, page: undefined })}>
                  {t.search.reset}
                </Link>
              )}
            </div>
          ) : (
            <ol className="mt-4 space-y-4">
              {result.hits.map((h) => (
                <li key={`${h.book}.${h.chapter}.${h.verse}`} className="card p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link href={`/bible/${edition.id}/${h.book}/${h.chapter}?v=${h.verse}#v${h.verse}`} className="font-semibold text-gold hover:underline">
                      {h.bookName} {h.chapter}:{h.verse}
                    </Link>
                    <span className="text-xs text-muted">{edition.abbreviation}</span>
                  </div>
                  <p className="mt-2 font-serif text-lg leading-relaxed" dir={edition.direction} lang={edition.language}>
                    {h.parts.map((p, i) => (p.match ? <mark key={i} className="search-hit">{p.text}</mark> : <span key={i}>{p.text}</span>))}
                  </p>
                  <Link href={`/bible/${edition.id}/${h.book}/${h.chapter}?v=${h.verse}#v${h.verse}`} className="mt-2 inline-block text-sm text-muted underline">
                    {t.search.open}
                  </Link>
                </li>
              ))}
            </ol>
          )}

          {totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-8 flex justify-between">
              {page > 1 ? <Link className="btn" href={qs({ page: page - 1 })}>← {t.search.prev}</Link> : <span />}
              {page < totalPages ? <Link className="btn" href={qs({ page: page + 1 })}>{t.search.next} →</Link> : <span />}
            </nav>
          )}
        </>
      )}

      {!q && (
        <div className="mt-8 text-muted">
          <p>Examples:</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {["John 3:16", "Psalm 23", "1 Corinthians 13", "Romans 8:28-39", "peace", '"fear not"'].map((ex) => (
              <li key={ex}>
                <Link className="btn btn-sm" href={`/search?q=${encodeURIComponent(ex)}&edition=${edition.id}`}>
                  {ex}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
