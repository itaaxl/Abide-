import { getChapter } from "@/lib/bible/provider";
import type { EditionMeta } from "@/lib/bible/types";
import type { Prefs } from "@/lib/prefs";

/**
 * Second translation shown alongside the main reader. Verses are aligned by
 * number only, so we warn whenever the two editions' numbering may differ.
 */
export async function ParallelColumn({
  primary,
  secondary,
  book,
  chapter,
  prefs,
}: {
  primary: EditionMeta;
  secondary: EditionMeta;
  book: string;
  chapter: number;
  prefs: Prefs;
}) {
  const bookMeta = secondary.books.find((b) => b.id === book);
  const primaryBook = primary.books.find((b) => b.id === book);
  const data = bookMeta ? await getChapter(secondary.id, book, chapter) : null;

  const warnings: string[] = [];
  if (!bookMeta) warnings.push(`${secondary.name} does not include this book.`);
  else if (!data) warnings.push(`${secondary.name} does not have chapter ${chapter} of this book.`);
  else {
    const a = primaryBook?.chapters[chapter - 1];
    const b = bookMeta.chapters[chapter - 1];
    if (a !== b) warnings.push(`Verse counts differ (${primary.abbreviation}: ${a}, ${secondary.abbreviation}: ${b}). Numbers may not line up.`);
    if (book === "PSA" && primary.psalmTitles !== secondary.psalmTitles)
      warnings.push(
        `${secondary.abbreviation} numbers Psalm titles differently from ${primary.abbreviation}, so verse numbers can be offset by one.`,
      );
  }

  return (
    <div className="border-t border-rule pt-6 lg:border-s lg:border-t-0 lg:ps-8 lg:pt-0">
      <p className="eyebrow mb-3">
        {secondary.name} ({secondary.abbreviation})
      </p>
      {warnings.map((w) => (
        <p key={w} role="note" className="mb-3 rounded-lg border border-rule bg-gold-soft/30 p-3 text-sm">
          ⚠ {w}
        </p>
      ))}
      {data && (
        <div
          dir={secondary.direction}
          lang={secondary.language}
          className="scripture"
          style={{ ["--reader-size" as string]: `${prefs.fontSize}px`, ["--reader-leading" as string]: prefs.lineHeight }}
        >
          {data.title && <p className="mb-4 text-[0.92em] italic text-muted">{data.title}</p>}
          {data.verses.map((v) => (
            <p key={v.v} className="mb-2">
              <span className="verse-num">{v.ve ? `${v.v}–${v.ve}` : v.v}</span>
              {v.t || "—"}
            </p>
          ))}
          <p className="mt-6 text-xs text-muted">{secondary.license.attribution}</p>
        </div>
      )}
    </div>
  );
}
