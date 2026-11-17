import type { Metadata } from "next";
import Link from "next/link";
import { WatchControls } from "@/components/WatchControls";
import type { MediaKind } from "@/content/media";
import { getSessionUser } from "@/lib/auth";
import { getMedia } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/request";

export const metadata: Metadata = {
  title: "Watch",
  description: "Christian series, films and educational videos, linked to their official viewing sites.",
};

const KIND_LABEL: Record<MediaKind, [string, string, string]> = {
  series: ["Series", "Série", "مسلسل"],
  movie: ["Movie", "Film", "فيلم"],
  educational: ["Educational video", "Vidéo éducative", "فيديو تعليمي"],
};

export default async function WatchPage({ searchParams }: PageProps<"/watch">) {
  const sp = await searchParams;
  const kind = typeof sp.kind === "string" && sp.kind in KIND_LABEL ? (sp.kind as MediaKind) : null;
  const [media, user, { T, locale }] = await Promise.all([getMedia(), getSessionUser(), getT()]);
  const states = new Map<string, "want" | "watched">();
  if (user?.emailVerified) {
    const { data } = (await (await createClient())?.from("watchlist").select("media_slug, watched")) ?? {};
    for (const w of data ?? []) states.set(w.media_slug, w.watched ? "watched" : "want");
  }
  const list = kind ? media.filter((m) => m.kind === kind) : media;
  const kinds = [...new Set(media.map((m) => m.kind))];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">{T("Watch", "Regarder", "شاهد")}</h1>
      <p className="mt-3 max-w-2xl text-muted">
        {T(
          "Films, series, and teaching videos, each linked to its official viewing site. We don’t host, copy, or re-stream anyone’s content, and we aren’t affiliated with these producers. Dramatizations add scenes and dialogue beyond the biblical text — read the Scripture alongside them.",
          "Films, séries et vidéos d’enseignement, chacun relié à son site officiel. Nous n’hébergeons ni ne rediffusons aucun contenu et ne sommes pas affiliés à ces producteurs. Les dramatisations ajoutent des scènes au-delà du texte biblique — lisez l’Écriture en parallèle.",
          "أفلام ومسلسلات وفيديوهات تعليمية، لكلٍّ منها رابط إلى موقعه الرسمي. لا نستضيف أي محتوى ولا نعيد بثّه، ولسنا تابعين لهذه الجهات. الأعمال الدرامية تضيف مشاهد تتجاوز النص الكتابي — اقرأ الكتاب المقدس إلى جانبها.",
        )}
      </p>
      <nav aria-label={T("Filter by type", "Filtrer par type", "تصفية حسب النوع")} className="mt-6 flex flex-wrap gap-2">
        <Link href="/watch" className={`btn btn-sm ${!kind ? "btn-primary" : ""}`} aria-current={!kind ? "page" : undefined}>
          {T("All", "Tout", "الكل")}
        </Link>
        {kinds.map((k) => (
          <Link key={k} href={`/watch?kind=${k}`} className={`btn btn-sm ${kind === k ? "btn-primary" : ""}`} aria-current={kind === k ? "page" : undefined}>
            {T(...KIND_LABEL[k])}
          </Link>
        ))}
      </nav>
      <p className="mt-2 text-xs text-muted">
        {T(
          "Age guidance is shown only where a trustworthy rating source exists; none of the current entries has one we’ve verified.",
          "Une indication d’âge n’est affichée que si une source fiable existe ; aucune entrée actuelle n’en a de vérifiée.",
          "لا نعرض تصنيفًا عمريًا إلا عند وجود مصدر موثوق؛ ولا يوجد مصدر مؤكَّد لأي عنصر حاليًا.",
        )}
      </p>
      <ul className="mt-6 space-y-5">
        {list.map((m) => (
          <li key={m.slug} className="card p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-tight">{m.title}</h2>
              <span className="text-xs uppercase tracking-wider text-gold">
                {T(...KIND_LABEL[m.kind])}
                {m.dramatized && ` · ${T("dramatization", "dramatisation", "عمل درامي")}`}
              </span>
            </div>
            <p className="mt-2 leading-relaxed">{(locale !== "en" && m.i18n?.[locale]?.description) || m.description}</p>
            {m.ageGuidance && (
              <p className="mt-1 text-sm text-muted">
                {T("Age guidance", "Âge conseillé", "العمر المناسب")}: {m.ageGuidance.label} ({m.ageGuidance.source})
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a href={m.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                {T("Watch on", "Regarder sur", "شاهد على")} {m.provider.replace(/ \(official site\)$/, "")} ↗
              </a>
              {user?.emailVerified && <WatchControls slug={m.slug} initial={states.get(m.slug) ?? "none"} />}
            </div>
            <p className="mt-3 text-xs text-muted">
              {T("Official external site", "Site officiel externe", "موقع رسمي خارجي")} ·{" "}
              {m.access === "external"
                ? T("opens in a new tab; viewing terms are set by the provider", "s’ouvre dans un nouvel onglet ; conditions fixées par le fournisseur", "يُفتح في علامة تبويب جديدة؛ شروط المشاهدة يحددها المزوّد")
                : T("authorized embed", "intégration autorisée", "تضمين مصرّح به")}{" "}
              · {T("link last checked", "lien vérifié le", "آخر تحقق من الرابط")} {m.lastChecked}
            </p>
          </li>
        ))}
      </ul>
      {!user && (
        <p className="mt-6 text-sm text-muted">
          <Link href="/auth/sign-in?next=/watch" className="underline">
            {T("Sign in", "Connectez-vous", "سجّل الدخول")}
          </Link>{" "}
          {T("to keep a private watchlist.", "pour garder une liste privée.", "لتحتفظ بقائمة مشاهدة خاصة.")}
        </p>
      )}
    </div>
  );
}
