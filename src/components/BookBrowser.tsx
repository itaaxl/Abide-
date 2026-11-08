import Link from "next/link";
import { groupBooks } from "@/lib/bible/navigation";
import type { EditionMeta } from "@/lib/bible/types";
import type { Locale } from "@/lib/prefs";

/** All books of the selected edition, grouped by its own collections. */
export function BookBrowser({ edition, locale, compact = false }: { edition: EditionMeta; locale: Locale; compact?: boolean }) {
  const groups = groupBooks(edition, locale);
  return (
    <div className={`grid gap-8 ${groups.length > 2 ? "lg:grid-cols-3" : "md:grid-cols-2"}`} dir={edition.direction}>
      {groups.map((g) => (
        <section key={g.collection} aria-labelledby={`col-${g.collection}`}>
          <h3 id={`col-${g.collection}`} className="eyebrow mb-3 border-b border-rule pb-2">
            {g.label} <span className="text-muted">· {g.books.length}</span>
          </h3>
          <ul className={`grid gap-x-3 ${compact ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-2"}`}>
            {g.books.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/bible/${edition.id}/${b.id}`}
                  className="flex items-baseline justify-between gap-2 rounded px-2 py-1.5 font-serif text-[1.05rem] hover:bg-gold-soft/40"
                >
                  <span>{b.name}</span>
                  <span className="font-sans text-xs text-muted">{b.chapters.length}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
