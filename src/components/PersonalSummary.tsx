import Link from "next/link";
import { getEdition } from "@/lib/bible/provider";
import { getPlans } from "@/lib/content";
import { endOfLocalDay } from "@/lib/time";
import { createClient } from "@/lib/supabase/server";
import { getUserTimezone } from "@/lib/daily";

/** Signed-in home area: saved verses, due cards, current plan, recent reading. */
export async function PersonalSummary({ name }: { name: string | null }) {
  const supabase = await createClient();
  if (!supabase) return null;
  const tz = await getUserTimezone();
  const dueBefore = endOfLocalDay(new Date(), tz).toISOString();
  const [bm, due, enr, recent] = await Promise.all([
    supabase.from("bookmarks").select("id", { count: "exact", head: true }),
    supabase.from("cards").select("id", { count: "exact", head: true }).lt("due_at", dueBefore),
    supabase.from("plan_enrollments").select("id, plan_slug, status").eq("status", "active").order("updated_at", { ascending: false }).limit(1),
    supabase.from("reading_history").select("edition, book, chapter, read_on").order("read_on", { ascending: false }).limit(4),
  ]);
  const plan = enr.data?.[0];
  const planMeta = plan ? (await getPlans()).find((p) => p.slug === plan.plan_slug) : undefined;
  let planDone = 0;
  if (plan) {
    const { count } = await supabase.from("plan_progress").select("day", { count: "exact", head: true }).eq("enrollment_id", plan.id);
    planDone = count ?? 0;
  }
  const recentItems = await Promise.all(
    (recent.data ?? []).map(async (r) => {
      const e = await getEdition(r.edition);
      return { ...r, name: e?.books.find((b) => b.id === r.book)?.name ?? r.book };
    }),
  );

  return (
    <section aria-labelledby="personal" className="card p-6">
      <h2 id="personal" className="font-serif text-2xl">
        Welcome back{name ? `, ${name}` : ""}
      </h2>
      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-muted">Saved verses</dt>
          <dd>
            <Link href="/library" className="font-serif text-3xl text-gold hover:underline">
              {bm.count ?? 0}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Flashcards due today</dt>
          <dd>
            <Link href="/flashcards/review" className="font-serif text-3xl text-gold hover:underline">
              {due.count ?? 0}
            </Link>
          </dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-sm text-muted">Reading plan</dt>
          <dd>
            {planMeta ? (
              <Link href={`/plans/${planMeta.slug}`} className="hover:underline">
                {planMeta.title}
                <span className="block text-sm text-muted">
                  {planDone} of {planMeta.days.length} days
                </span>
              </Link>
            ) : (
              <Link href="/plans" className="text-sm underline">
                Choose a plan
              </Link>
            )}
          </dd>
        </div>
      </dl>
      {recentItems.length > 0 && (
        <div className="mt-4 border-t border-rule pt-4">
          <h3 className="text-sm text-muted">Recently read</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {recentItems.map((r) => (
              <li key={`${r.edition}${r.book}${r.chapter}${r.read_on}`}>
                <Link className="btn btn-sm" href={`/bible/${r.edition}/${r.book}/${r.chapter}`}>
                  {r.name} {r.chapter}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
