import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ReaderView } from "@/components/reader/ReaderView";
import { getChapter, getEdition } from "@/lib/bible/provider";
import { parseVerseParam } from "@/lib/bible/navigation";

type P = PageProps<"/bible/[edition]/[book]/[chapter]">;

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { edition: id, book, chapter } = await params;
  const e = await getEdition(id);
  const b = e?.books.find((x) => x.id === book);
  if (!e || !b) return {};
  const ch = await getChapter(id, book, Number(chapter));
  const first = ch?.verses.find((v) => v.t)?.t ?? "";
  return {
    title: `${b.name} ${chapter} (${e.abbreviation})`,
    description: first.length > 155 ? `${first.slice(0, 152)}…` : first,
    alternates: { canonical: `/bible/${id}/${book}/${chapter}` },
  };
}

export default async function ChapterPage({ params, searchParams }: P) {
  const { edition: id, book, chapter: rawChapter } = await params;
  const sp = await searchParams;
  const edition = await getEdition(id);
  if (!edition) notFound();
  if (book !== book.toUpperCase()) redirect(`/bible/${id}/${book.toUpperCase()}/${rawChapter}`);
  const chapter = Number(rawChapter);
  if (!Number.isInteger(chapter) || chapter < 1) notFound();
  const bookMeta = edition.books.find((b) => b.id === book);
  // A real book with a chapter beyond its end is a 404; a book missing from
  // this edition gets the reader's explanatory "not in this translation" state.
  if (bookMeta && chapter > bookMeta.chapters.length) notFound();
  const parallel = typeof sp.parallel === "string" ? sp.parallel : null;
  return <ReaderView edition={edition} book={book} chapter={chapter} target={parseVerseParam(sp.v)} parallel={parallel} />;
}
