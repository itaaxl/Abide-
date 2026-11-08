import type { Metadata } from "next";
import Link from "next/link";
import { DailyVerseCard } from "@/components/DailyVerseCard";
import { DailyReminder } from "@/components/DailyReminder";
import { getSessionUser } from "@/lib/auth";
import { todayFor } from "@/lib/daily";
import { getDictionary, getPrefs } from "@/lib/request";
import { addDays } from "@/lib/time";

export const metadata: Metadata = { title: "Daily Verse" };

export default async function DailyPage() {
  const [{ t }, prefs, user, today] = await Promise.all([getDictionary(), getPrefs(), getSessionUser(), todayFor()]);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 font-serif text-4xl">{t.daily.title}</h1>
      <DailyVerseCard date={today.date} edition={prefs.edition} t={t} canSave={Boolean(user?.emailVerified)} full />
      <p className="mt-4 text-sm text-muted">
        Today is {today.date} in {today.timezone}. The verse changes at midnight in your timezone; there is no streak to keep — come back whenever you like.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/daily/${addDays(today.date, -1)}`} className="btn">
          ← Yesterday
        </Link>
        <Link href="/daily/archive" className="btn">
          {t.daily.archive}
        </Link>
      </div>
      <div className="mt-10">
        <DailyReminder />
      </div>
    </div>
  );
}
