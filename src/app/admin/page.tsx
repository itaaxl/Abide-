import type { Metadata } from "next";
import Link from "next/link";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { gate } from "@/components/Gate";
import { DAILY_VERSES } from "@/content/daily-verses";
import { MEDIA } from "@/content/media";
import { PLANS } from "@/content/plans";
import { TOPICS } from "@/content/topics";
import { aiConfig } from "@/lib/guidance/config";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { addDays, localDate } from "@/lib/time";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

const TABS = { daily: "Daily verses", plan: "Reading plans", topic: "Topics", media: "Media links", usage: "AI usage", audit: "Audit log" } as const;
type Tab = keyof typeof TABS;

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const g = await gate("/admin", "Admin");
  if (!g.user) return g.panel;
  if (!g.user.isAdmin)
    return (
      <div className="mx-auto max-w-xl px-4 py-14">
        <div className="card p-8">
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          <p className="mt-3 text-muted">Your account doesn’t have administrator access. Administrator roles are granted by the site operator in the database.</p>
        </div>
      </div>
    );
  const sp = await searchParams;
  const tab: Tab = typeof sp.tab === "string" && sp.tab in TABS ? (sp.tab as Tab) : "daily";
  const supabase = (await createClient())!;

  let body: React.ReactNode = null;
  if (tab === "usage") {
    const admin = createAdminClient();
    const since = addDays(localDate(new Date(), "UTC"), -13);
    const { data } = (await admin?.from("ai_usage").select("day, requests, input_tokens, output_tokens, failures").gte("day", since)) ?? { data: null };
    const byDay = new Map<string, { users: number; requests: number; input: number; output: number; failures: number }>();
    for (const r of data ?? []) {
      const d = byDay.get(r.day) ?? { users: 0, requests: 0, input: 0, output: 0, failures: 0 };
      d.users++;
      d.requests += r.requests;
      d.input += r.input_tokens;
      d.output += r.output_tokens;
      d.failures += r.failures;
      byDay.set(r.day, d);
    }
    const cfg = aiConfig();
    body = (
      <div>
        <p className="text-sm text-muted">
          Aggregate counts only — request text is never stored or shown. Model: {cfg.model} · daily limit per user: {cfg.dailyLimit} · AI {cfg.enabled ? "configured" : "not configured"}
          {!admin && " · service key missing, usage unavailable"}
        </p>
        <table className="mt-4 w-full text-sm">
          <thead><tr className="text-start text-muted"><th className="text-start">Day (UTC)</th><th>Users</th><th>Requests</th><th>Input tokens</th><th>Output tokens</th><th>Failures</th></tr></thead>
          <tbody>
            {[...byDay.entries()].sort().reverse().map(([day, d]) => (
              <tr key={day} className="border-t border-rule text-center"><td className="text-start">{day}</td><td>{d.users}</td><td>{d.requests}</td><td>{d.input.toLocaleString()}</td><td>{d.output.toLocaleString()}</td><td>{d.failures}</td></tr>
            ))}
          </tbody>
        </table>
        {byDay.size === 0 && <p className="mt-4 text-muted">No usage recorded in the last 14 days.</p>}
      </div>
    );
  } else if (tab === "audit") {
    const { data } = await supabase.from("admin_audit").select("*").order("created_at", { ascending: false }).limit(100);
    body = (
      <ul className="divide-y divide-rule text-sm">
        {(data ?? []).map((a) => (
          <li key={a.id} className="py-2">{new Date(a.created_at).toISOString()} · {a.action} · {a.entity}/{a.entity_id} · by {a.actor_id?.slice(0, 8)}</li>
        ))}
      </ul>
    );
  } else {
    const table = { daily: "content_daily_verses", plan: "content_plans", topic: "content_topics", media: "content_media" }[tab];
    const { data: rows } = await supabase.from(table).select("*").order("updated_at", { ascending: false });
    const seedCount = { daily: DAILY_VERSES.length, plan: PLANS.length, topic: TOPICS.length, media: MEDIA.length }[tab];
    const template =
      tab === "daily"
        ? { id: "dv-new", ref_key: "JHN.3.16", topic: "love", phrase: "", reflection: "", prayer: "", question: "" }
        : tab === "plan"
          ? PLANS[0]
          : tab === "topic"
            ? TOPICS[0]
            : { ...MEDIA[0], slug: "new-title" };
    body = (
      <div className="space-y-6">
        <p className="text-sm text-muted">
          {seedCount} entries ship with the site as reviewed seed content. Rows saved here override seed entries with the same id/slug or add new ones. Drafts are visible only to admins. References are validated against the World English Bible on save.
        </p>
        {(rows ?? []).map((r) => {
          const id = (r.id ?? r.slug) as string;
          const json = tab === "daily" ? { id: r.id, ref_key: r.ref_key, topic: r.topic, phrase: r.phrase ?? "", reflection: r.reflection, prayer: r.prayer, question: r.question } : r.data;
          return (
            <section key={id} className="card p-4">
              <h3 className="mb-2 font-semibold">{id}</h3>
              <ContentEditor kind={tab} id={id} status={r.status} initial={JSON.stringify(json, null, 2)} />
            </section>
          );
        })}
        <section className="card p-4">
          <h3 className="mb-2 font-semibold">New or override (template)</h3>
          <ContentEditor kind={tab} initial={JSON.stringify(template, null, 2)} />
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
      <nav aria-label="Admin sections" className="mt-6 flex flex-wrap gap-2 border-b border-rule pb-3">
        {(Object.keys(TABS) as Tab[]).map((t) => (
          <Link key={t} href={`/admin?tab=${t}`} className={`btn btn-sm ${tab === t ? "btn-primary" : ""}`} aria-current={tab === t ? "page" : undefined}>
            {TABS[t]}
          </Link>
        ))}
      </nav>
      <div className="mt-6">{body}</div>
    </div>
  );
}
