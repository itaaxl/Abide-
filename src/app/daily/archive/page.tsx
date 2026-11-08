import type { Metadata } from "next";
import Link from "next/link";
import { resolvePassage } from "@/lib/bible/passage";
import { ROTATION_EPOCH, dailyEntryFor, todayFor } from "@/lib/daily";
import { getDictionary, getPrefs } from "@/lib/request";
import { addDays } from "@/lib/time";

export const metadata: Metadata = { title: "Daily Verse archive" };

export default async function ArchivePage() {
  const [{ t }, prefs, today] = await Promise.all([getDictionary(), getPrefs(), todayFor()]);
  const days: string[] = [];
  for (let d = today.date, i = 0; d >= ROTATION_EPOCH && i < 60; d = addDays(d, -1), i++) days.push(d);
  const rows = await Promise.all(
    days.map(async (date) => {
      const e = await dailyEntryFor(date);
      const p = await resolvePassage(e.ref, prefs.edition);
      return { date, label: p?.label ?? e.ref, abbr: p?.edition.abbreviation ?? "", topic: e.topic };
    }),
  );
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 font-serif text-4xl">{t.daily.archive}</h1>
      <ul className="divide-y divide-rule">
        {rows.map((r) => (
          <li key={r.date}>
            <Link href={r.date === today.date ? "/daily" : `/daily/${r.date}`} className="flex items-baseline justify-between gap-3 py-3 hover:bg-gold-soft/20">
              <time dateTime={r.date} className="text-sm text-muted">{r.date}</time>
              <span className="font-serif text-lg">{r.label}</span>
              <span className="text-xs text-muted">{r.topic} · {r.abbr}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
