import type { Metadata } from "next";
import Link from "next/link";
import { getPlans } from "@/lib/content";
import { getEdition } from "@/lib/bible/provider";
import { planText } from "@/content/plans";
import { getPrefs, getT } from "@/lib/request";

export const metadata: Metadata = { title: "Reading Plans", description: "Short reading plans through John, the Psalms, and the New Testament." };

export default async function PlansPage() {
  const [plans, prefs, { T, locale }] = await Promise.all([getPlans(), getPrefs(), getT()]);
  const edition = await getEdition(prefs.edition);
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">{T("Reading Plans", "Plans de lecture", "خطط القراءة")}</h1>
      <p className="mt-2 max-w-2xl text-muted">
        {T(
          "Each plan is a set of real passages, one small portion a day. Read at your own pace — you can pause, catch up, or shift the schedule at any time.",
          "Chaque plan propose de vrais passages, une petite portion par jour. Lisez à votre rythme — vous pouvez faire une pause, rattraper ou décaler le programme à tout moment.",
          "كل خطة مجموعة من المقاطع الحقيقية، جزء صغير كل يوم. اقرأ على مهلك — يمكنك التوقف أو اللحاق أو تأجيل الجدول متى شئت.",
        )}
      </p>
      <ul className="mt-8 grid gap-6 md:grid-cols-2">
        {plans.map((p) => (
          <li key={p.slug} className="card flex flex-col p-6">
            <h2 className="text-lg font-semibold tracking-tight">{planText(p, locale).title}</h2>
            <p className="mt-1 text-sm text-gold">
              {T(`${p.days.length} days · about ${p.minutesPerDay} min a day`, `${p.days.length} jours · environ ${p.minutesPerDay} min par jour`, `${p.days.length} يومًا · نحو ${p.minutesPerDay} دقائق يوميًا`)} · {edition?.abbreviation}
            </p>
            <p className="mt-3 flex-1 text-muted">{planText(p, locale).description}</p>
            <Link href={`/plans/${p.slug}`} className="btn mt-4 w-fit">
              {T("View plan", "Voir le plan", "عرض الخطة")}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
