import type { Metadata } from "next";
import Link from "next/link";
import { WatchControls } from "@/components/WatchControls";
import type { MediaKind } from "@/content/media";
import { getSessionUser } from "@/lib/auth";
import { getMedia } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Watch",
  description: "Christian series, films and educational videos, linked to their official viewing sites.",
};

const KIND_LABEL: Record<MediaKind, string> = { series: "Series", movie: "Movie", educational: "Educational video" };

export default async function WatchPage({ searchParams }: PageProps<"/watch">) {
  const sp = await searchParams;
  const kind = typeof sp.kind === "string" && sp.kind in KIND_LABEL ? (sp.kind as MediaKind) : null;
  const [media, user] = await Promise.all([getMedia(), getSessionUser()]);
  const states = new Map<string, "want" | "watched">();
  if (user?.emailVerified) {
    const { data } = (await (await createClient())?.from("watchlist").select("media_slug, watched")) ?? {};
    for (const w of data ?? []) states.set(w.media_slug, w.watched ? "watched" : "want");
  }
  const list = kind ? media.filter((m) => m.kind === kind) : media;
  const kinds = [...new Set(media.map((m) => m.kind))];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Watch</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Films, series, and teaching videos, each linked to its <strong>official</strong> viewing site. We don’t host, copy, or re-stream anyone’s content, and we aren’t affiliated with these producers. Dramatizations add scenes and dialogue beyond the biblical text — read the Scripture alongside them.
      </p>
      <nav aria-label="Filter by type" className="mt-6 flex flex-wrap gap-2">
        <Link href="/watch" className={`btn btn-sm ${!kind ? "btn-primary" : ""}`} aria-current={!kind ? "page" : undefined}>All</Link>
        {kinds.map((k) => (
          <Link key={k} href={`/watch?kind=${k}`} className={`btn btn-sm ${kind === k ? "btn-primary" : ""}`} aria-current={kind === k ? "page" : undefined}>
            {KIND_LABEL[k]}
          </Link>
        ))}
      </nav>
      <p className="mt-2 text-xs text-muted">Age guidance is shown only where a trustworthy rating source exists; none of the current entries has one we’ve verified.</p>
      <ul className="mt-6 space-y-5">
        {list.map((m) => (
          <li key={m.slug} className="card p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-tight">{m.title}</h2>
              <span className="text-xs uppercase tracking-wider text-gold">
                {KIND_LABEL[m.kind]}
                {m.dramatized && " · dramatization"}
              </span>
            </div>
            <p className="mt-2 leading-relaxed">{m.description}</p>
            {m.ageGuidance && <p className="mt-1 text-sm text-muted">Age guidance: {m.ageGuidance.label} (source: {m.ageGuidance.source})</p>}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a href={m.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Watch on {m.provider.replace(/ \(official site\)$/, "")} ↗
              </a>
              {user?.emailVerified && <WatchControls slug={m.slug} initial={states.get(m.slug) ?? "none"} />}
            </div>
            <p className="mt-3 text-xs text-muted">
              Official external site · {m.access === "external" ? "opens in a new tab; viewing terms are set by the provider" : "authorized embed"} · link last checked {m.lastChecked}
            </p>
          </li>
        ))}
      </ul>
      {!user && <p className="mt-6 text-sm text-muted"><Link href="/auth/sign-in?next=/watch" className="underline">Sign in</Link> to keep a private watchlist.</p>}
    </div>
  );
}
