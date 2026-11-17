import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getUserTimezone } from "@/lib/daily";
import { getT } from "@/lib/request";
import { createClient } from "@/lib/supabase/server";
import { addDays, localDate, startOfLocalDay } from "@/lib/time";

/**
 * A gentle, private look back over the last 7 days. Counts only — no
 * streaks, no pressure, nothing shown to anyone else.
 */
export async function WeekSummary() {
  const user = await getSessionUser();
  if (!user?.emailVerified) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const { T } = await getT();
  const tz = await getUserTimezone();
  const today = localDate(new Date(), tz);
  const fromDay = addDays(today, -6);
  const since = startOfLocalDay(fromDay, tz).toISOString();

  const [read, reviews, plans, prayers] = await Promise.all([
    supabase.from("reading_history").select("book", { count: "exact", head: true }).gte("read_on", fromDay),
    supabase.from("reviews").select("id", { count: "exact", head: true }).gte("reviewed_at", since),
    supabase.from("plan_progress").select("day", { count: "exact", head: true }).gte("completed_at", since),
    supabase.from("prayer_entries").select("id", { count: "exact", head: true }).gte("created_at", since),
  ]);
  const items = [
    { n: read.count ?? 0, label: T("chapters read", "chapitres lus", "أصحاحات مقروءة"), href: "/bible" },
    { n: reviews.count ?? 0, label: T("cards reviewed", "cartes révisées", "بطاقات مراجَعة"), href: "/flashcards?tab=saved" },
    { n: plans.count ?? 0, label: T("plan readings", "lectures de plan", "قراءات الخطط"), href: "/plans" },
    { n: prayers.count ?? 0, label: T("prayers written", "prières écrites", "صلوات مكتوبة"), href: "/journal" },
  ];
  const total = items.reduce((s, i) => s + i.n, 0);

  return (
    <section aria-labelledby="week-h" className="rounded-2xl border border-rule bg-surface p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="week-h" className="text-sm font-semibold">
          {T("Your last 7 days", "Vos 7 derniers jours", "آخر 7 أيام")}
        </h2>
        <span className="text-xs text-muted">🔒 {T("Only you see this", "Visible par vous seul", "لا يراه غيرك")}</span>
      </div>
      <ul className="mt-3 grid grid-cols-4 gap-2 text-center">
        {items.map((i) => (
          <li key={i.label}>
            <Link href={i.href} className="pressable block rounded-xl px-1 py-2 hover:bg-gold-soft/40">
              <span className="block text-xl font-bold tabular-nums text-gold">{i.n}</span>
              <span className="block text-[11px] leading-tight text-muted">{i.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">
        {total === 0
          ? T(
              "A fresh week. Even one chapter or one verse is a good start.",
              "Une nouvelle semaine. Un seul chapitre ou un seul verset, c’est déjà un bon début.",
              "أسبوع جديد. أصحاح واحد أو آية واحدة بداية طيبة.",
            )
          : T(
              "Thank you for making room for Scripture this week.",
              "Merci d’avoir fait de la place à l’Écriture cette semaine.",
              "شكرًا لأنك أفسحت مكانًا لكلمة الله هذا الأسبوع.",
            )}
      </p>
    </section>
  );
}
