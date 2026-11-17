import { tri } from "@/lib/i18n/tri";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getEdition } from "@/lib/bible/provider";
import { resolveBook } from "@/lib/bible/reference";
import { getDictionary } from "@/lib/request";
import { BOOK_INTROS } from "@/content/book-intros";

export async function generateMetadata({ params }: PageProps<"/bible/[edition]/[book]">): Promise<Metadata> {
  const { edition: id, book } = await params;
  const e = await getEdition(id);
  const b = e?.books.find((x) => x.id === book);
  return b && e ? { title: `${b.name} · ${e.abbreviation}` } : {};
}

export default async function BookPage({ params }: PageProps<"/bible/[edition]/[book]">) {
  const { edition: id, book: rawBook } = await params;
  const edition = await getEdition(id);
  if (!edition) notFound();
  const code = rawBook.toUpperCase();
  const book = edition.books.find((b) => b.id === code);
  if (!book) {
    const resolved = resolveBook(edition, decodeURIComponent(rawBook).replace(/[-_]/g, " "));
    if (resolved && edition.books.some((b) => b.id === resolved)) redirect(`/bible/${id}/${resolved}`);
    notFound();
  }
  if (code !== rawBook) redirect(`/bible/${id}/${code}`);
  const { t, locale } = await getDictionary();
  const T = tri(locale);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10" dir={edition.direction}>
      <Link href={`/bible/${id}`} className="text-sm text-muted underline">
        <span aria-hidden="true" className="inline-block rtl:rotate-180">←</span> {t.reader.books}
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">{book.name}</h1>
      {book.longName !== book.name && <p className="mt-1 font-serif italic text-muted">{book.longName}</p>}
      {BOOK_INTROS[book.id] && (
        <aside className="card mt-6 p-5" dir="ltr" lang="en">
          <p className="text-xs uppercase tracking-wider text-muted" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
            {T("Introduction · editorial summary, not Scripture", "Introduction (en anglais) · résumé éditorial, pas l’Écriture", "مقدمة (بالإنجليزية) · ملخّص تحريري، ليس من الكتاب المقدس")}
          </p>
          <p className="mt-2 leading-relaxed">{BOOK_INTROS[book.id]}</p>
        </aside>
      )}
      <h2 className="eyebrow mt-8">{t.reader.chapters}</h2>
      <ul className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-8">
        {book.chapters.map((verses, i) => (
          <li key={i}>
            <Link
              href={`/bible/${id}/${book.id}/${i + 1}`}
              className="flex h-12 items-center justify-center rounded-lg border border-rule bg-surface font-serif text-lg hover:border-gold"
              aria-label={`${t.reader.chapter} ${i + 1} (${verses})`}
            >
              {i + 1}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
