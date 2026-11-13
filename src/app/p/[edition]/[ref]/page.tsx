import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScriptureQuote } from "@/components/ScriptureQuote";
import { DownloadImageButton } from "@/components/DownloadImageButton";
import { getDictionary } from "@/lib/request";
import { site } from "@/config/site";
import { resolvePassage } from "@/lib/bible/passage";

/**
 * Public passage page. Shows Scripture only — never notes, journal entries,
 * guidance requests, or any account data — so links are safe to share.
 * The reference key is already in the edition's own numbering.
 */
type P = PageProps<"/p/[edition]/[ref]">;

async function load(params: P["params"]) {
  const { edition, ref } = await params;
  if (ref.split("-").length > 2 || ref.length > 24) return null;
  return resolvePassage(decodeURIComponent(ref), edition, edition);
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await load(params);
  if (!p) return { title: "Passage not found" };
  const desc = p.text.length > 180 ? `${p.text.slice(0, 177)}…` : p.text;
  return {
    title: `${p.label} (${p.edition.abbreviation})`,
    description: desc,
    openGraph: { title: `${p.label} — ${p.edition.name}`, description: desc, type: "article", siteName: site.name },
    twitter: { card: "summary", title: p.label, description: desc },
  };
}

export default async function PublicPassage({ params }: P) {
  const p = await load(params);
  if (!p || p.verses.length === 0 || p.verses.length > 60) notFound();
  const { t } = await getDictionary();
  const c = t.cards;
  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <article className="card p-8 sm:p-10">
        <p className="eyebrow mb-4">{p.edition.name}</p>
        <ScriptureQuote passage={p} />
        <p className="mt-6 text-xs text-muted">{p.edition.license.attribution}</p>
      </article>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href={p.href} className="btn btn-primary">
          Read the full chapter
        </Link>
        <DownloadImageButton
          className="btn"
          labels={{ downloadImage: c.downloadImage, square: c.square, story: c.story, imageFailed: c.imageFailed, excerpt: c.excerpt }}
          verse={{
            text: p.text,
            reference: p.label,
            translation: `${p.edition.name} (${p.edition.abbreviation})`,
            direction: p.edition.direction,
            lang: p.edition.language,
            siteName: site.name,
          }}
        />
      </div>
    </div>
  );
}
