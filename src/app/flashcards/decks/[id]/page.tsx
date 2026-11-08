import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CardRowControls, CustomCardForm, DeckSettings } from "@/components/flashcards/DeckControls";
import { gate, PrivateBadge } from "@/components/Gate";
import { listEditions } from "@/lib/bible/provider";
import { buildFace, type CardRow } from "@/lib/flashcards";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Deck", robots: { index: false } };

export default async function DeckPage({ params }: PageProps<"/flashcards/decks/[id]">) {
  const { id } = await params;
  const g = await gate(`/flashcards/decks/${id}`, "Flashcards");
  if (!g.user) return g.panel;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = (await createClient())!;
  const { data: deck } = await supabase.from("decks").select("*").eq("id", id).maybeSingle();
  if (!deck) notFound(); // RLS hides other users' decks: indistinguishable from missing
  const { data: cards } = await supabase.from("cards").select("*").eq("deck_id", id).order("created_at");
  const faces = await Promise.all(((cards ?? []) as CardRow[]).map(async (c) => ({ row: c, face: await buildFace(c) })));
  const editions = (await listEditions()).map((e) => ({ id: e.id, abbr: `${e.languageName} · ${e.abbreviation}` }));
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/flashcards" className="text-sm text-muted underline">← Flashcards</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-4xl">{deck.name}</h1>
        <PrivateBadge />
      </div>
      <div className="mt-4 flex gap-2">
        <Link className="btn btn-primary" href={`/flashcards/review?deck=${id}`}>Review due</Link>
        <Link className="btn" href={`/flashcards/review?deck=${id}&mode=practice`}>Practise</Link>
      </div>
      <h2 className="mt-8 font-serif text-2xl">Cards ({faces.length})</h2>
      <ul className="mt-4 space-y-3">
        {faces.map(({ row, face }) => (
          <li key={row.id} className="card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className={face?.scripture ? "font-semibold text-gold" : "font-semibold"}>
                {face?.scripture ? `${face.reference} · ${face.editionAbbr}` : "Your own card — not Scripture"}
              </p>
              <p className="text-xs text-muted">
                {row.kind.replaceAll("_", " ")} · due {new Date(row.due_at).toLocaleDateString()} · {row.reps} successful reviews in a row
              </p>
            </div>
            <p className={`mt-2 ${face?.scripture ? "font-serif text-lg" : ""}`} dir={face?.direction}>
              {face ? (face.kind === "text_to_ref" ? face.front : face.kind === "custom" ? `${face.front} → ${face.back}` : face.back) : "This passage could not be loaded from its edition."}
            </p>
            <div className="mt-3">
              <CardRowControls id={row.id} scripture={Boolean(face?.scripture)} editions={editions.filter((e) => e.id !== row.edition)} />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-serif text-xl">Add your own card</h2>
          <CustomCardForm deckId={id} />
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-serif text-xl">Deck settings</h2>
          <DeckSettings id={id} name={deck.name} description={deck.description ?? ""} />
        </section>
      </div>
      <p className="mt-6 text-sm text-muted">
        To add Scripture cards, select verses in the <Link className="underline" href="/bible">reader</Link> and choose “Make flashcard”. Cards keep the translation they were created in; use “Copy to translation” to add another version explicitly.
      </p>
    </div>
  );
}
