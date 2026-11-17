import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrivateBadge } from "@/components/Gate";
import { DayToggle, EnrollButton, EnrollmentControls } from "@/components/PlanControls";
import { getSessionUser } from "@/lib/auth";
import { mapReference } from "@/lib/bible/mapping";
import { getEdition } from "@/lib/bible/provider";
import { formatReference, parseRefKey, passageHref } from "@/lib/bible/reference";
import { getPlans } from "@/lib/content";
import { getUserTimezone } from "@/lib/daily";
import { planText } from "@/content/plans";
import { getPrefs, getT } from "@/lib/request";
import { createClient } from "@/lib/supabase/server";
import { daysBetween, localDate } from "@/lib/time";
import { site } from "@/config/site";

export async function generateMetadata({ params }: PageProps<"/plans/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const plan = (await getPlans()).find((p) => p.slug === slug);
  return plan ? { title: plan.title, description: plan.description } : {};
}

export default async function PlanPage({ params }: PageProps<"/plans/[slug]">) {
  const { slug } = await params;
  const plan = (await getPlans()).find((p) => p.slug === slug);
  if (!plan) notFound();
  const [user, prefs, { T, locale }] = await Promise.all([getSessionUser(), getPrefs(), getT()]);
  const text = planText(plan, locale);

  let enrollment: { id: string; status: string; start_date: string; edition: string } | null = null;
  let completed = new Set<number>();
  if (user?.emailVerified) {
    const supabase = (await createClient())!;
    const { data } = await supabase.from("plan_enrollments").select("id, status, start_date, edition").eq("plan_slug", slug).neq("status", "left").maybeSingle();
    enrollment = data;
    if (data) {
      const { data: prog } = await supabase.from("plan_progress").select("day").eq("enrollment_id", data.id);
      completed = new Set((prog ?? []).map((p) => p.day));
    }
  }
  const edition = (await getEdition(enrollment?.edition ?? prefs.edition)) ?? (await getEdition(site.defaultEdition))!;

  // Validate every assignment against the selected edition and map numbering honestly.
  const days = await Promise.all(
    plan.days.map(async (d, i) => ({
      day: i + 1,
      items: await Promise.all(
        d.refs.map(async (key) => {
          const ref = parseRefKey(key)!;
          const m = await mapReference(ref, site.defaultEdition, edition.id);
          if (m.ref) return { ok: true as const, label: formatReference(m.ref, edition), href: passageHref(edition.id, m.ref), note: m.status === "psalm-title-offset" ? T("numbering adjusted", "numérotation ajustée", "ترقيم معدّل") : null };
          const web = (await getEdition(site.defaultEdition))!;
          return { ok: false as const, label: formatReference(ref, web), href: passageHref(web.id, ref), note: m.status === "missing-book" ? T(`not included in ${edition.abbreviation}`, `absent de ${edition.abbreviation}`, `غير موجود في ${edition.abbreviation}`) : T(`numbering differs in ${edition.abbreviation}; opens in ${web.abbreviation}`, `numérotation différente dans ${edition.abbreviation} ; s’ouvre dans ${web.abbreviation}`, `ترقيم مختلف في ${edition.abbreviation}؛ يُفتح في ${web.abbreviation}`) };
        }),
      ),
    })),
  );
  const conflicts = days.flatMap((d) => d.items).filter((i) => !i.ok).length;

  let scheduledDay = 0;
  if (enrollment) {
    const tz = await getUserTimezone();
    scheduledDay = Math.min(plan.days.length, daysBetween(enrollment.start_date, localDate(new Date(), tz)) + 1);
  }
  const nextUndone = plan.days.findIndex((_, i) => !completed.has(i + 1)) + 1;
  const behind = Boolean(enrollment && enrollment.status !== "completed" && nextUndone > 0 && nextUndone < scheduledDay - 1);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/plans" className="text-sm text-muted underline">
        <span aria-hidden="true" className="inline-block rtl:rotate-180">←</span> {T("Reading Plans", "Plans de lecture", "خطط القراءة")}
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">{text.title}</h1>
      <p className="mt-1 text-gold">
        {T(`${plan.days.length} days · about ${plan.minutesPerDay} minutes a day`, `${plan.days.length} jours · environ ${plan.minutesPerDay} minutes par jour`, `${plan.days.length} يومًا · نحو ${plan.minutesPerDay} دقائق يوميًا`)} · {edition.name}
      </p>
      <p className="mt-4 leading-relaxed">{text.description}</p>
      {conflicts > 0 && (
        <p role="note" className="card mt-4 p-4 text-sm">
          ⚠{" "}
          {T(
            `${conflicts} reading${conflicts === 1 ? "" : "s"} can’t be shown in ${edition.abbreviation} with matching verse numbers and will open in the World English Bible instead.`,
            `${conflicts} lecture(s) ne peuvent pas s’afficher dans ${edition.abbreviation} avec la même numérotation et s’ouvriront dans la World English Bible.`,
            `${conflicts} من القراءات لا يمكن عرضها في ${edition.abbreviation} بنفس الترقيم، وستُفتح في الترجمة الإنجليزية (WEB).`,
          )}
        </p>
      )}

      <div className="mt-6">
        {enrollment ? (
          <section className="card space-y-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">
                {enrollment.status === "completed"
                  ? T("Plan completed 🎉", "Plan terminé 🎉", "اكتملت الخطة 🎉")
                  : enrollment.status === "paused"
                    ? T("Paused", "En pause", "متوقفة مؤقتًا")
                    : T(`Day ${Math.max(1, scheduledDay)} of ${plan.days.length}`, `Jour ${Math.max(1, scheduledDay)} sur ${plan.days.length}`, `اليوم ${Math.max(1, scheduledDay)} من ${plan.days.length}`)}
              </p>
              <PrivateBadge />
            </div>
            <p className="text-sm text-muted">
              {T(`${completed.size} of ${plan.days.length} readings completed.`, `${completed.size} lectures sur ${plan.days.length} terminées.`, `أُنجزت ${completed.size} من ${plan.days.length} قراءات.`)}
              {behind &&
                " " +
                  T(
                    "Life happens — you can carry on where you left off, or shift the schedule so it starts from today. Nothing you’ve completed is lost.",
                    "La vie suit son cours — reprenez où vous en étiez, ou décalez le programme pour qu’il commence aujourd’hui. Rien de ce que vous avez lu n’est perdu.",
                    "الحياة تحدث — تابع من حيث توقفت، أو أجّل الجدول ليبدأ من اليوم. لن تفقد شيئًا مما أنجزته.",
                  )}
            </p>
            <div className="h-2 rounded-full bg-rule" aria-hidden="true">
              <div className="h-2 rounded-full bg-gold" style={{ width: `${(completed.size / plan.days.length) * 100}%` }} />
            </div>
            <EnrollmentControls id={enrollment.id} status={enrollment.status} behind={behind} />
          </section>
        ) : user?.emailVerified ? (
          <EnrollButton slug={plan.slug} edition={edition.id} canEnroll />
        ) : (
          <p className="text-sm text-muted">
            {T("Anyone can read along below. ", "Chacun peut lire ci-dessous. ", "يمكن لأي شخص القراءة أدناه. ")}
            <Link href={`/auth/sign-in?next=/plans/${plan.slug}`} className="underline">
              {T("Sign in", "Connectez-vous", "سجّل الدخول")}
            </Link>
            {T(" to track your progress privately.", " pour suivre votre progression en privé.", " لتتابع تقدّمك بشكل خاص.")}
          </p>
        )}
      </div>

      <ol className="mt-8 divide-y divide-rule">
        {days.map((d) => {
          const isToday = enrollment && d.day === nextUndone;
          return (
            <li key={d.day} className={`flex flex-wrap items-center justify-between gap-3 py-3 ${isToday ? "rounded-lg bg-gold-soft/20 px-2" : ""}`}>
              <div>
                <span className="me-3 text-sm text-muted">{T(`Day ${d.day}`, `Jour ${d.day}`, `اليوم ${d.day}`)}</span>
                {d.items.map((it) => (
                  <span key={it.href} className="me-3">
                    <Link href={it.href} className="font-serif text-lg hover:underline">{it.label}</Link>
                    {it.note && <span className="ms-1 text-xs text-muted">({it.note})</span>}
                  </span>
                ))}
              </div>
              {enrollment && enrollment.status !== "left" && <DayToggle enrollmentId={enrollment.id} day={d.day} done={completed.has(d.day)} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
