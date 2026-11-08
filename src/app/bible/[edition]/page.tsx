import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookBrowser } from "@/components/BookBrowser";
import { getEdition, listEditions } from "@/lib/bible/provider";
import { getDictionary } from "@/lib/request";

export async function generateMetadata({ params }: PageProps<"/bible/[edition]">): Promise<Metadata> {
  const e = await getEdition((await params).edition);
  return e ? { title: `${e.name} — books`, description: e.canonDescription } : {};
}

export default async function EditionPage({ params }: PageProps<"/bible/[edition]">) {
  const { edition: id } = await params;
  const edition = await getEdition(id);
  if (!edition) notFound();
  const { t, locale } = await getDictionary();
  const editions = await listEditions();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="eyebrow">{t.reader.books}</p>
      <h1 className="mt-2 font-serif text-4xl">{edition.name}</h1>
      <p className="mt-2 max-w-2xl text-muted">{edition.canonDescription}</p>
      <nav aria-label={t.reader.translation} className="mt-4 flex flex-wrap gap-2">
        {editions.map((e) => (
          <Link key={e.id} href={`/bible/${e.id}`} className={`btn btn-sm ${e.id === edition.id ? "btn-primary" : ""}`} aria-current={e.id === edition.id ? "page" : undefined}>
            {e.languageName} · {e.abbreviation}
          </Link>
        ))}
      </nav>
      <div className="mt-10">
        <BookBrowser edition={edition} locale={locale} />
      </div>
    </div>
  );
}
