import type { Metadata } from "next";
import Link from "next/link";
import { DailyTargetForm, NewDeckForm } from "@/components/flashcards/DeckControls";
import { gate, PrivateBadge } from "@/components/Gate";
import { getUserTimezone } from "@/lib/daily";
import { createClient } from "@/lib/supabase/server";
import { endOfLocalDay, localDate, startOfLocalDay } from "@/lib/time";

export const metadata: Metadata = { title: "Flashcards", robots: { index: false } };

export default async function FlashcardsPage() {
  const g = await gate("/flashcards", "Flashcards");
  if (!g.user) return g.panel;
  const supabase = (await createClient())!;
  const tz = await getUserTimezone();
  const now = new Date();
  const [{ data: decks }, { data: cards }, { data: profile }, { count: reviewsToday }, { count: reviewsTotal }] = await Promise.all([
    supabase.from("decks").select("id, name, description").order("created_at"),
    supabase.from("cards").select("deck_id, due_at, reps, kind, edition, book, chapter, verse_start, verse_end"),
    supabase.from("profiles").select("daily_review_target").eq("id", g.user.id).maybeSingle(),
    supabase.from("reviews").select("id", { count: "exact", head: true }).gte("reviewed_at", startOfLocalDay(localDate(now, tz), tz).toISOString()),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
  ]);
  const dueCut = endOfLocalDay(now, tz).getTime();
  const all = cards ?? [];
  const dueAll = all.filter((c) => new Date(c.due_at).getTime() < dueCut).length;
  const passages = new Set(all.filter((c) => c.kind !== "custom").map((c) => `${c.book}.${c.chapter}.${c.verse_start}`)).size;
  const practised = new Set(all.filter((c) => c.reps > 0 && c.kind !== "custom").map((c) => `${c.book}.${c.chapter}.${c.verse_start}`)).size;
  const target = profile?.daily_review_target ?? 20;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-4xl">Flashcards</h1>
        <PrivateBadge />
      </div>
      <section className="card mt-6 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="font-serif text-2xl">{dueAll} card{dueAll === 1 ? "" : "s"} due today</p>
          <p className="text-sm text-muted">
            Reviewed today: {reviewsToday ?? 0} of your goal of {target}. Stopping early is fine.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/flashcards/review" className={`btn ${dueAll ? "btn-primary" : ""}`}>Review due cards</Link>
          <Link href="/flashcards/review?mode=practice" className="btn">Practise any card</Link>
        </div>
      </section>
      <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["Cards", all.length],
          ["Passages saved", passages],
          ["Passages practised", practised],
          ["Reviews all time", reviewsTotal ?? 0],
        ].map(([k, v]) => (
          <div key={k as string} className="card p-4">
            <dt className="text-sm text-muted">{k}</dt>
            <dd className="font-serif text-3xl">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted">These are simple counts of your activity; they don’t measure how much you’ll remember.</p>

      <h2 className="mt-10 font-serif text-2xl">Decks</h2>
      {decks?.length ? (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {decks.map((d) => {
            const inDeck = all.filter((c) => c.deck_id === d.id);
            const due = inDeck.filter((c) => new Date(c.due_at).getTime() < dueCut).length;
            const learned = inDeck.filter((c) => c.reps > 0).length;
            return (
              <li key={d.id} className="card p-5">
                <Link href={`/flashcards/decks/${d.id}`} className="font-serif text-xl hover:underline">{d.name}</Link>
                {d.description && <p className="mt-1 text-sm text-muted">{d.description}</p>}
                <p className="mt-2 text-sm">{inDeck.length} cards · {due} due · {learned} reviewed at least once</p>
                <div className="mt-2 h-2 rounded-full bg-rule" aria-hidden="true">
                  <div className="h-2 rounded-full bg-gold" style={{ width: `${inDeck.length ? (learned / inDeck.length) * 100 : 0}%` }} />
                </div>
                <div className="mt-3 flex gap-2">
                  <Link className="btn btn-sm" href={`/flashcards/review?deck=${d.id}`}>Review</Link>
                  <Link className="btn btn-sm" href={`/flashcards/review?deck=${d.id}&mode=practice`}>Practise</Link>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-muted">
          No decks yet. Select a verse in the <Link className="underline" href="/bible">reader</Link> and choose “Make flashcard”, or create a deck below.
        </p>
      )}
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="card p-5"><NewDeckForm /></div>
        <div className="card p-5"><DailyTargetForm value={target} /></div>
      </div>
    </div>
  );
}
