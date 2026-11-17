import type { Metadata } from "next";
import Link from "next/link";
import { topicText } from "@/content/topics";
import { getTopics } from "@/lib/content";
import { getT } from "@/lib/request";

export const metadata: Metadata = { title: "Discover", description: "Curated Bible passages on hope, peace, forgiveness, love, wisdom, courage and more." };

export default async function DiscoverPage() {
  const [topics, { T, locale }] = await Promise.all([getTopics(), getT()]);
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">{T("Discover", "Découvrir", "اكتشف")}</h1>
      <p className="mt-3 max-w-2xl text-muted">
        {T(
          "Passages gathered by theme. Each list was chosen by people (not AI); the short notes are editorial summaries, not Scripture.",
          "Des passages regroupés par thème. Chaque liste a été choisie par des personnes (pas par l’IA) ; les courtes notes sont éditoriales, pas l’Écriture.",
          "مقاطع مجمّعة حسب الموضوع. اختار أشخاص كل قائمة (لا الذكاء الاصطناعي)؛ والملاحظات القصيرة تحريرية وليست من الكتاب المقدس.",
        )}
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((t) => (
          <li key={t.slug}>
            <Link href={`/discover/${t.slug}`} className="card block h-full p-5 hover:border-gold">
              <h2 className="text-lg font-semibold tracking-tight">{topicText(t, locale).label}</h2>
              <p className="mt-1 text-sm text-muted">{topicText(t, locale).description}</p>
              <p className="mt-3 text-xs text-gold">{T(`${t.passages.length} passages`, `${t.passages.length} passages`, `${t.passages.length} مقاطع`)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
