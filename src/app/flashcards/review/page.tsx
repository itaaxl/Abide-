import type { Metadata } from "next";
import { gate } from "@/components/Gate";
import { ReviewSession } from "@/components/flashcards/ReviewSession";
import { getUserTimezone } from "@/lib/daily";
import { buildFace, type CardRow } from "@/lib/flashcards";
import { createClient } from "@/lib/supabase/server";
import { endOfLocalDay, localDate, startOfLocalDay } from "@/lib/time";

export const metadata: Metadata = { title: "Review flashcards", robots: { index: false } };

export default async function ReviewPage({ searchParams }: PageProps<"/flashcards/review">) {
  const g = await gate("/flashcards/review", "Flashcards");
  if (!g.user) return g.panel;
  const sp = await searchParams;
  const practice = sp.mode === "practice";
  const deck = typeof sp.deck === "string" && /^[0-9a-f-]{36}$/.test(sp.deck) ? sp.deck : null;
  const supabase = (await createClient())!;
  const tz = await getUserTimezone();
  const now = new Date();

  let q = supabase.from("cards").select("*").limit(200);
  if (deck) q = q.eq("deck_id", deck);
  // Due today = due before the end of the user's local day.
  if (!practice) q = q.lt("due_at", endOfLocalDay(now, tz).toISOString()).order("due_at");
  // Practice: least recently reviewed first, so practice covers the whole deck over time.
  else q = q.order("last_reviewed_at", { ascending: true, nullsFirst: true });
  const [{ data }, { data: profile }, { count: reviewedToday }] = await Promise.all([
    q,
    supabase.from("profiles").select("daily_review_target").eq("id", g.user.id).maybeSingle(),
    supabase.from("reviews").select("id", { count: "exact", head: true }).gte("reviewed_at", startOfLocalDay(localDate(now, tz), tz).toISOString()),
  ]);
  const rows = ((data ?? []) as CardRow[]).slice(0, practice ? 30 : 200);
  const faces = (await Promise.all(rows.map(buildFace))).filter((f) => f !== null);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{practice ? "Practice" : "Today’s review"}</h1>
      <ReviewSession cards={faces} practice={practice} timezone={tz} target={profile?.daily_review_target ?? 20} reviewedToday={reviewedToday ?? 0} />
      <p className="mt-6 text-xs text-muted">
        Keyboard: Space or Enter shows the answer; 1–4 rate it. Intervals come from a simple, documented spaced-repetition schedule — not from AI.
      </p>
    </div>
  );
}
