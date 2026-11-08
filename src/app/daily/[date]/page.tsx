import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DailyVerseCard } from "@/components/DailyVerseCard";
import { getSessionUser } from "@/lib/auth";
import { ROTATION_EPOCH, isIsoDate, todayFor } from "@/lib/daily";
import { getDictionary, getPrefs } from "@/lib/request";
import { addDays } from "@/lib/time";

export async function generateMetadata({ params }: PageProps<"/daily/[date]">): Promise<Metadata> {
  return { title: `Daily Verse · ${(await params).date}` };
}

export default async function DailyDatePage({ params }: PageProps<"/daily/[date]">) {
  const { date } = await params;
  if (!isIsoDate(date) || date < ROTATION_EPOCH) notFound();
  const [{ t }, prefs, user, today] = await Promise.all([getDictionary(), getPrefs(), getSessionUser(), todayFor()]);
  if (date > today.date) notFound(); // no future verses
  if (date === today.date) redirect("/daily");
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 font-serif text-4xl">{t.daily.title}</h1>
      <DailyVerseCard date={date} edition={prefs.edition} t={t} canSave={Boolean(user?.emailVerified)} full />
      <nav className="mt-8 flex justify-between" aria-label="Daily verse dates">
        {date > ROTATION_EPOCH ? <Link className="btn" href={`/daily/${addDays(date, -1)}`}>← {addDays(date, -1)}</Link> : <span />}
        <Link className="btn" href={addDays(date, 1) === today.date ? "/daily" : `/daily/${addDays(date, 1)}`}>
          {addDays(date, 1)} →
        </Link>
      </nav>
    </div>
  );
}
