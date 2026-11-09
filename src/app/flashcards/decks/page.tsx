import type { Metadata } from "next";
import Link from "next/link";
import { DailyTargetForm, NewDeckForm } from "@/components/flashcards/DeckControls";
import { gate } from "@/components/Gate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Decks", robots: { index: false } };

/** Deck management (moved off the main Verses screen; all existing decks and cards are kept). */
export default async function DecksPage() {
  const g = await gate("/flashcards/decks", "Decks");
  if (!g.user) return g.panel;
  const supabase = (await createClient())!;
  const [{ data: decks }, { data: cards }, { data: profile }] = await Promise.all([
    supabase.from("decks").select("id, name, description").order("created_at"),
    supabase.from("cards").select("deck_id"),
    supabase.from("profiles").select("daily_review_target").eq("id", g.user.id).maybeSingle(),
  ]);
  return (
    <div className="mx-auto max-w-xl px-4 pb-6 pt-5">
      <Link href="/flashcards?tab=saved" className="text-sm text-muted hover:underline">
        ← Saved
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Decks</h1>
      <ul className="mt-5 space-y-2">
        {(decks ?? []).map((d) => (
          <li key={d.id}>
            <Link href={`/flashcards/decks/${d.id}`} className="flex items-center justify-between rounded-2xl border border-rule bg-surface px-4 py-3 hover:border-gold">
              <span className="font-semibold">{d.name}</span>
              <span className="text-sm text-muted">{(cards ?? []).filter((c) => c.deck_id === d.id).length}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-6 space-y-5 rounded-2xl border border-rule bg-surface p-5">
        <NewDeckForm />
        <DailyTargetForm value={profile?.daily_review_target ?? 20} />
      </div>
    </div>
  );
}
