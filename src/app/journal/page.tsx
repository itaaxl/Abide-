import type { Metadata } from "next";
import Link from "next/link";
import { gate, PrivateBadge } from "@/components/Gate";
import { PrayerTimer } from "@/components/journal/PrayerTimer";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Prayer Journal", robots: { index: false, follow: false } };

const STATUS_LABEL = { ongoing: "Ongoing", answered: "Answered", reflection: "Reflection" } as const;

export default async function JournalPage({ searchParams }: PageProps<"/journal">) {
  const g = await gate("/journal", "Prayer Journal");
  if (!g.user) return g.panel;
  const sp = await searchParams;
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
        <h1 className="font-serif text-4xl">Prayer Journal</h1>
        <PrivateBadge />
      </div>
      <p className="mt-2 text-muted">A private place to write prayers and reflections. Entries are never shared, never public, and never sent to AI.</p>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link href="/journal/new" className="btn btn-primary">New entry</Link>
        <form className="flex flex-1 flex-wrap gap-2" role="search">
          <label htmlFor="jq" className="sr-only">Search your journal</label>
          <input id="jq" name="q" defaultValue={q} className="input max-w-xs" placeholder="Search your entries" />
          <select name="status" defaultValue={status} className="input w-auto" aria-label="Filter by status">
            <option value="">All</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button className="btn">Search</button>
        </form>
      </div>
      {entries?.length ? (
        <ul className="mt-6 space-y-3">
          {entries.map((e) => (
            <li key={e.id} className="card p-4">
              <Link href={`/journal/${e.id}`} className="block">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-serif text-xl">{e.title}</span>
                  <span className="text-xs text-muted">{e.entry_date} · {STATUS_LABEL[e.status as keyof typeof STATUS_LABEL]}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{e.body}</p>
                {e.tags?.length > 0 && <p className="mt-2 text-xs text-gold">{e.tags.join(" · ")}</p>}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 text-muted">{q || status ? "No entries match." : "No entries yet. Whenever you’re ready, write your first one."}</p>
      )}
      <div className="mt-10">
        <PrayerTimer />
      </div>
    </div>
  );
}
