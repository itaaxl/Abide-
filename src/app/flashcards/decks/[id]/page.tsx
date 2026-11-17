import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CardRowControls, CustomCardForm, DeckSettings } from "@/components/flashcards/DeckControls";
import { gate, PrivateBadge } from "@/components/Gate";
import { listEditions } from "@/lib/bible/provider";
import { buildFace, type CardRow } from "@/lib/flashcards";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/request";

export const metadata: Metadata = { title: "Deck", robots: { index: false } };

export default async function DeckPage({ params }: PageProps<"/flashcards/decks/[id]">) {
  const { id } = await params;
  const g = await gate(`/flashcards/decks/${id}`, "Flashcards");
  if (!g.user) return g.panel;
  const { T, locale } = await getT();
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = (await createClient())!;
  const { data: deck } = await supabase.from("decks").select("*").eq("id", id).maybeSingle();
  if (!deck) notFound(); // RLS hides other users' decks: indistinguishable from missing
  const { data: cards } = await supabase.from("cards").select("*").eq("deck_id", id).order("created_at");
  const faces = await Promise.all(((cards ?? []) as CardRow[]).map(async (c) => ({ row: c, face: await buildFace(c) })));
  const editions = (await listEditions()).map((e) => ({ id: e.id, abbr: `${e.languageName} · ${e.abbreviation}` }));
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/flashcards/decks" className="text-sm text-muted underline">
        <span aria-hidden="true" className="inline-block rtl:rotate-180">←</span> {T("Decks", "Paquets", "المجموعات")}
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{deck.name}</h1>
        <PrivateBadge />
      </div>
      <div className="mt-4 flex gap-2">
        <Link className="btn btn-primary" href={`/flashcards/review?deck=${id}`}>{T("Review due", "Réviser", "راجع المستحق")}</Link>
        <Link className="btn" href={`/flashcards/review?deck=${id}&mode=practice`}>{T("Practise", "S’entraîner", "تمرّن")}</Link>
      </div>
      <h2 className="mt-8 text-lg font-semibold tracking-tight">{T("Cards", "Cartes", "البطاقات")} ({faces.length})</h2>
      <ul className="mt-4 space-y-3">
        {faces.map(({ row, face }) => (
          <li key={row.id} className="card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className={face?.scripture ? "font-semibold text-gold" : "font-semibold"}>
                {face?.scripture ? `${face.reference} · ${face.editionAbbr}` : T("Your own card — not Scripture", "Votre carte — pas l’Écriture", "بطاقتك — ليست من الكتاب المقدس")}
              </p>
              <p className="text-xs text-muted">
                {T("due", "échéance", "الموعد")} {new Date(row.due_at).toLocaleDateString(locale)} · {T(`${row.reps} successful reviews in a row`, `${row.reps} révisions réussies d’affilée`, `${row.reps} مراجعات ناجحة متتالية`)}
              </p>
            </div>
            <p className={`mt-2 ${face?.scripture ? "font-serif text-lg" : ""}`} dir={face?.direction}>
              {face ? (face.kind === "text_to_ref" ? face.front : face.kind === "custom" ? `${face.front} → ${face.back}` : face.back) : T("This passage could not be loaded from its edition.", "Ce passage n’a pas pu être chargé.", "تعذّر تحميل هذا المقطع من طبعته.")}
            </p>
            <div className="mt-3">
              <CardRowControls id={row.id} scripture={Boolean(face?.scripture)} editions={editions.filter((e) => e.id !== row.edition)} />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 text-base font-semibold">{T("Add your own card", "Ajouter votre carte", "أضف بطاقتك")}</h2>
          <CustomCardForm deckId={id} />
        </section>
        <section className="card p-5">
          <h2 className="mb-3 text-base font-semibold">{T("Deck settings", "Réglages du paquet", "إعدادات المجموعة")}</h2>
          <DeckSettings id={id} name={deck.name} description={deck.description ?? ""} />
        </section>
      </div>
      <p className="mt-6 text-sm text-muted">
        {T(
          "To add Scripture cards, select verses in the Bible reader and choose “Make flashcard”, or save them from verse cards. Cards keep the translation they were created in; use “Copy to translation” to add another version.",
          "Pour ajouter des cartes d’Écriture, sélectionnez des versets dans le lecteur et choisissez « Créer une carte », ou enregistrez-les depuis les cartes de versets. Les cartes gardent leur traduction ; utilisez « Copier vers… » pour une autre version.",
          "لإضافة بطاقات من الكتاب المقدس، اختر آيات في القارئ ثم «أنشئ بطاقة»، أو احفظها من بطاقات الآيات. تحتفظ البطاقات بترجمتها؛ استخدم «انسخ إلى ترجمة» لإضافة نسخة أخرى.",
        )}
      </p>
    </div>
  );
}
