import type { Metadata } from "next";
import Link from "next/link";
import { gate, PrivateBadge } from "@/components/Gate";
import { DeleteSavedGuidance } from "@/components/guidance/DeleteSavedGuidance";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/request";

export const metadata: Metadata = { title: "Saved guidance", robots: { index: false, follow: false } };

interface Saved {
  opening?: string;
  passages: { key: string; label: string; connection: string }[];
  prayer?: string;
  kind: string;
}

export default async function SavedGuidancePage() {
  const g = await gate("/guidance/saved", "Saved guidance");
  if (!g.user) return g.panel;
  const { T } = await getT();
  const supabase = (await createClient())!;
  const { data } = await supabase.from("saved_guidance").select("*").order("created_at", { ascending: false }).limit(100);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{T("Saved guidance", "Aides enregistrées", "الإرشادات المحفوظة")}</h1>
        <PrivateBadge />
      </div>
      {!data?.length ? (
        <p className="mt-6 text-muted">
          {T("Nothing saved. Guidance is only saved when you choose to. ", "Rien d’enregistré. Une aide n’est conservée que si vous le choisissez. ", "لا شيء محفوظ. لا يُحفظ الإرشاد إلا إذا اخترت ذلك. ")}
          <Link className="underline" href="/guidance">
            {T("Find guidance", "Trouver de l’aide", "اطلب إرشادًا")}
          </Link>
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {data.map((s) => {
            const r = s.response as Saved;
            return (
              <li key={s.id} className="card p-5">
                <p className="text-xs text-muted">{new Date(s.created_at).toLocaleDateString()} · {r.kind === "ai" ? T("AI-assisted", "Avec IA", "بمساعدة الذكاء الاصطناعي") : T("Curated", "Éditorial", "منتقى")}</p>
                <p className="mt-2 italic">“{s.request_text}”</p>
                {r.opening && <p className="mt-2">{r.opening}</p>}
                <ul className="mt-3 space-y-2">
                  {r.passages.map((p) => (
                    <li key={p.key}>
                      <Link className="font-semibold text-gold underline" href={`/p/${s.edition}/${p.key}`}>{p.label}</Link> — {p.connection}
                    </li>
                  ))}
                </ul>
                <DeleteSavedGuidance id={s.id} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
