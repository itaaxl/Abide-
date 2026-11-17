import type { Metadata } from "next";
import Link from "next/link";
import { gate, PrivateBadge } from "@/components/Gate";
import { PrayerTimer } from "@/components/journal/PrayerTimer";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/request";

export const metadata: Metadata = { title: "Prayer Journal", robots: { index: false, follow: false } };

const STATUS_LABEL: Record<string, [string, string, string]> = {
  ongoing: ["Ongoing", "En cours", "مستمرة"],
  answered: ["Answered", "Exaucée", "مُستجابة"],
  reflection: ["Reflection", "Réflexion", "تأمّل"],
};

export default async function JournalPage({ searchParams }: PageProps<"/journal">) {
  const g = await gate("/journal", "Prayer Journal");
  if (!g.user) return g.panel;
  const sp = await searchParams;
  const { T } = await getT();
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const status = typeof sp.status === "string" && sp.status in STATUS_LABEL ? sp.status : "";
  const supabase = (await createClient())!;
  let query = supabase.from("prayer_entries").select("id, title, body, status, tags, entry_date").order("entry_date", { ascending: false }).limit(200);
  if (status) query = query.eq("status", status);
  if (q) {
    const safe = q.replace(/[%_,()]/g, " ");
    query = query.or(`title.ilike.%${safe}%,body.ilike.%${safe}%`);
  }
  const { data: entries } = await query;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{T("Prayer Journal", "Journal de prière", "دفتر الصلاة")}</h1>
        <PrivateBadge />
      </div>
      <p className="mt-2 text-muted">
        {T(
          "A private place to write prayers and reflections. Entries are never shared, never public, and never sent to AI.",
          "Un lieu privé pour écrire prières et réflexions. Les entrées ne sont jamais partagées, jamais publiques et jamais envoyées à l’IA.",
          "مكان خاص لكتابة الصلوات والتأملات. لا تُشارك المدخلات ولا تُنشر ولا تُرسل إلى الذكاء الاصطناعي أبدًا.",
        )}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link href="/journal/new" className="btn btn-primary">{T("New entry", "Nouvelle entrée", "مدخل جديد")}</Link>
        <form className="flex flex-1 flex-wrap gap-2" role="search">
          <label htmlFor="jq" className="sr-only">{T("Search your journal", "Chercher dans votre journal", "ابحث في دفترك")}</label>
          <input id="jq" name="q" defaultValue={q} className="input max-w-xs" placeholder={T("Search your entries", "Chercher vos entrées", "ابحث في مدخلاتك")} />
          <select name="status" defaultValue={status} className="input w-auto" aria-label={T("Filter by status", "Filtrer par statut", "تصفية حسب الحالة")}>
            <option value="">{T("All", "Tout", "الكل")}</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {T(...v)}
              </option>
            ))}
          </select>
          <button className="btn">{T("Search", "Chercher", "بحث")}</button>
        </form>
      </div>
      {entries?.length ? (
        <ul className="mt-6 space-y-3">
          {entries.map((e) => (
            <li key={e.id} className="card p-4">
              <Link href={`/journal/${e.id}`} className="block">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-serif text-xl">{e.title}</span>
                  <span className="text-xs text-muted">
                    {e.entry_date} · {STATUS_LABEL[e.status] ? T(...STATUS_LABEL[e.status]) : e.status}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{e.body}</p>
                {e.tags?.length > 0 && <p className="mt-2 text-xs text-gold">{e.tags.join(" · ")}</p>}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 text-muted">
          {q || status
            ? T("No entries match.", "Aucune entrée ne correspond.", "لا توجد مدخلات مطابقة.")
            : T("No entries yet. Whenever you’re ready, write your first one.", "Aucune entrée pour l’instant. Quand vous serez prêt, écrivez la première.", "لا مدخلات بعد. متى كنت مستعدًا، اكتب أول مدخل.")}
        </p>
      )}
      <div className="mt-10">
        <PrayerTimer />
      </div>
    </div>
  );
}
