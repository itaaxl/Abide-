import { getT } from "@/lib/request";
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

  const { T } = await getT();
  const warnings: string[] = [];
  if (!bookMeta) warnings.push(T(`${secondary.name} does not include this book.`, `${secondary.name} ne contient pas ce livre.`, `${secondary.name} لا تتضمن هذا السفر.`));
  else if (!data) warnings.push(T(`${secondary.name} does not have chapter ${chapter} of this book.`, `${secondary.name} n’a pas le chapitre ${chapter} de ce livre.`, `${secondary.name} لا تحتوي الأصحاح ${chapter} من هذا السفر.`));
  else {
    const a = primaryBook?.chapters[chapter - 1];
    const b = bookMeta.chapters[chapter - 1];
    if (a !== b)
      warnings.push(
        book === "PSA" && primary.psalmTitles !== secondary.psalmTitles
          ? T(
              `${secondary.abbreviation} numbers this Psalm’s title differently from ${primary.abbreviation} (${a} vs ${b} verses), so verse numbers are offset.`,
              `${secondary.abbreviation} numérote le titre de ce psaume autrement que ${primary.abbreviation} (${a} contre ${b} versets) : les numéros sont décalés.`,
              `${secondary.abbreviation} ترقّم عنوان هذا المزمور بشكل مختلف عن ${primary.abbreviation} (${a} مقابل ${b} آيات)، لذا الأرقام مزاحة.`,
            )
          : T(
              `Verse counts differ (${primary.abbreviation}: ${a}, ${secondary.abbreviation}: ${b}). Numbers may not line up.`,
              `Nombre de versets différent (${primary.abbreviation} : ${a}, ${secondary.abbreviation} : ${b}). Les numéros peuvent ne pas correspondre.`,
              `عدد الآيات مختلف (${primary.abbreviation}: ${a}، ${secondary.abbreviation}: ${b}). قد لا تتطابق الأرقام.`,
            ),
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
