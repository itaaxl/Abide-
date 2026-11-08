import Link from "next/link";
import { resolvePassage } from "@/lib/bible/passage";
import { refKey } from "@/lib/bible/reference";
import { dailyEntryFor } from "@/lib/daily";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { PassageActions } from "./PassageActions";
import { ScriptureQuote } from "./ScriptureQuote";

export async function DailyVerseCard({
  date,
  edition,
  t,
  canSave,
  full = false,
}: {
  date: string;
  edition: string;
  t: Dictionary;
  canSave: boolean;
  full?: boolean;
}) {
  const entry = await dailyEntryFor(date);
  const passage = await resolvePassage(entry.ref, edition);
  if (!passage) return null;
  const r = passage.ref;
  return (
    <section aria-labelledby={`daily-${date}`} className="card p-6 sm:p-8">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={`daily-${date}`} className="eyebrow">
          {full ? t.daily.title : t.daily.today}
        </h2>
        <time dateTime={date} className="text-xs text-muted">
          {new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, { dateStyle: "long", timeZone: "UTC" })}
        </time>
      </div>
      <div className="mt-4">
        <ScriptureQuote passage={passage} />
      </div>
      <div className="mt-5">
        <PassageActions
          edition={passage.edition.id}
          book={r.book}
          chapter={r.chapter}
          verseStart={r.verse ?? 1}
          verseEnd={r.endVerse ?? r.verse ?? 1}
          label={passage.label}
          text={passage.text}
          attribution={passage.edition.license.attribution}
          abbreviation={passage.edition.abbreviation}
          chapterHref={passage.href}
          shareKey={refKey(r)}
          canSave={canSave}
          compact={!full}
        />
      </div>
      {full ? (
        <div className="mt-6 space-y-5 border-t border-rule pt-6">
          <p className="text-xs uppercase tracking-wider text-muted">{t.common.editorial}</p>
          <div>
            <h3 className="font-serif text-xl">{t.daily.reflection}</h3>
            <p className="mt-1 leading-relaxed">{entry.reflection}</p>
          </div>
          {entry.prayer && (
            <div>
              <h3 className="font-serif text-xl">{t.daily.prayer}</h3>
              <p className="mt-1 leading-relaxed">{entry.prayer}</p>
            </div>
          )}
          {entry.question && (
            <div>
              <h3 className="font-serif text-xl">{t.daily.question}</h3>
              <p className="mt-1 leading-relaxed">{entry.question}</p>
            </div>
          )}
        </div>
      ) : (
        <Link href="/daily" className="mt-2 inline-block text-sm text-muted underline">
          {t.daily.reflection} →
        </Link>
      )}
    </section>
  );
}
