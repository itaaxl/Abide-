import type { Metadata } from "next";
import Link from "next/link";
import { gate, PrivateBadge } from "@/components/Gate";
import { LibraryItemControls } from "@/components/LibraryItemControls";
import { getEdition, getVerses } from "@/lib/bible/provider";
import { SUGGESTED_TAGS } from "@/lib/annotations";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My Library", robots: { index: false } };

type Tab = "bookmarks" | "highlights" | "notes";

async function labelFor(edition: string, book: string, chapter: number, from: number, to: number) {
  const e = await getEdition(edition);
  const name = e?.books.find((b) => b.id === book)?.name ?? book;
  const verses = (await getVerses(edition, book, chapter, from, to)) ?? [];
  return {
    label: `${name} ${chapter}:${from}${to !== from ? `–${to}` : ""}`,
    abbr: e?.abbreviation ?? edition,
    dir: e?.direction ?? "ltr",
    text: verses.map((v) => v.t).join(" "),
    href: `/bible/${edition}/${book}/${chapter}?v=${from}${to !== from ? `-${to}` : ""}#v${from}`,
  };
}

export default async function LibraryPage({ searchParams }: PageProps<"/library">) {
  const g = await gate("/library", "My Library");
  if (!g.user)
    return (
      <>
        {g.panel}
        <div className="mx-auto -mt-2 max-w-xl px-4 pb-10">
          <MoreLinks />
        </div>
      </>
    );
  const sp = await searchParams;
  const tab: Tab = sp.tab === "highlights" || sp.tab === "notes" ? sp.tab : "bookmarks";
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase().slice(0, 100) : "";
  const tag = typeof sp.tag === "string" ? sp.tag.slice(0, 30) : "";
  const supabase = (await createClient())!;

  let items: { id: string; label: string; abbr: string; dir: string; text: string; href: string; extra?: string; tags?: string[]; color?: string }[] = [];
  if (tab === "bookmarks") {
    let query = supabase.from("bookmarks").select("*").order("created_at", { ascending: false }).limit(300);
    if (tag) query = query.contains("tags", [tag]);
    const { data } = await query;
    items = await Promise.all((data ?? []).map(async (b) => ({ id: b.id, tags: b.tags, ...(await labelFor(b.edition, b.book, b.chapter, b.verse_start, b.verse_end)) })));
  } else if (tab === "highlights") {
    const { data } = await supabase.from("highlights").select("*").order("created_at", { ascending: false }).limit(300);
    items = await Promise.all((data ?? []).map(async (h) => ({ id: h.id, color: h.color, ...(await labelFor(h.edition, h.book, h.chapter, h.verse, h.verse)) })));
  } else {
    const { data } = await supabase.from("notes").select("*").order("updated_at", { ascending: false }).limit(300);
    items = await Promise.all((data ?? []).map(async (n) => ({ id: n.id, extra: n.body, ...(await labelFor(n.edition, n.book, n.chapter, n.verse_start, n.verse_end)) })));
  }
  if (q) items = items.filter((i) => i.label.toLowerCase().includes(q) || i.text.toLowerCase().includes(q) || i.extra?.toLowerCase().includes(q));
  const tabs: { id: Tab; label: string }[] = [
    { id: "bookmarks", label: "Bookmarks" },
    { id: "highlights", label: "Highlights" },
    { id: "notes", label: "Notes" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">My Library</h1>
        <PrivateBadge />
      </div>
      <div className="mt-4">
        <MoreLinks />
      </div>
      <nav aria-label="Library sections" className="mt-6 flex gap-2 border-b border-rule">
        {tabs.map((t) => (
          <Link key={t.id} href={`/library?tab=${t.id}`} aria-current={tab === t.id ? "page" : undefined} className={`-mb-px border-b-2 px-4 py-2 ${tab === t.id ? "border-gold font-semibold" : "border-transparent text-muted"}`}>
            {t.label}
          </Link>
        ))}
      </nav>
      <form className="mt-4 flex flex-wrap gap-2" role="search">
        <input type="hidden" name="tab" value={tab} />
        <label htmlFor="lq" className="sr-only">
          Search your library by reference or text
        </label>
        <input id="lq" name="q" defaultValue={q} className="input max-w-sm" placeholder="Search by reference, verse, or note" />
        <button className="btn">Search</button>
        {(q || tag) && (
          <Link className="btn btn-ghost" href={`/library?tab=${tab}`}>
            Clear
          </Link>
        )}
      </form>
      {tab === "bookmarks" && (
        <div className="mt-3 flex flex-wrap gap-1 text-sm" aria-label="Filter by collection">
          {SUGGESTED_TAGS.map((t) => (
            <Link key={t} href={`/library?tab=bookmarks&tag=${encodeURIComponent(t)}`} className={`btn btn-sm ${tag === t ? "btn-primary" : ""}`}>
              {t}
            </Link>
          ))}
        </div>
      )}
      {items.length === 0 ? (
        <p className="mt-10 text-muted">
          Nothing here yet. Select a verse in the <Link href="/bible" className="underline">reader</Link> to bookmark, highlight, or add a note.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {items.map((i) => (
            <li key={i.id} className={`card p-4 ${i.color ? `border-s-8` : ""}`} style={i.color ? { borderInlineStartColor: `var(--hl-${i.color})` } : undefined}>
              <div className="flex items-baseline justify-between gap-2">
                <Link href={i.href} className="font-semibold text-gold hover:underline">
                  {i.label}
                </Link>
                <span className="text-xs text-muted">{i.abbr}</span>
              </div>
              <p className="mt-2 font-serif text-lg" dir={i.dir}>
                {i.text}
              </p>
              {i.extra && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-gold-soft/20 p-3 text-sm">{i.extra}</p>}
              <LibraryItemControls kind={tab} id={i.id} tags={i.tags} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Secondary sections that live under Library (not in the bottom bar). */
function MoreLinks() {
  const links = [
    { href: "/journal", label: "Prayer Journal", hint: "Private prayers and reflections", d: "M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6V3ZM6 3v18M10 8h5M10 12h5" },
    { href: "/discover", label: "Discover", hint: "Passages by theme", d: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM15.5 8.5l-2 5-5 2 2-5 5-2Z" },
    { href: "/watch", label: "Watch", hint: "Films and teaching, official links", d: "M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1ZM10 9.5v5l4.5-2.5L10 9.5Z" },
  ];
  return (
    <nav aria-label="More in Library" className="grid gap-2 sm:grid-cols-3">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="pressable card flex items-center gap-3 px-4 py-3 hover:border-gold">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-soft text-gold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={l.d} />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">{l.label}</span>
            <span className="block truncate text-xs text-muted">{l.hint}</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
