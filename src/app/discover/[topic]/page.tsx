import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PassageActions } from "@/components/PassageActions";
import { ScriptureQuote } from "@/components/ScriptureQuote";
import { getSessionUser } from "@/lib/auth";
import { resolvePassage } from "@/lib/bible/passage";
import { refKey } from "@/lib/bible/reference";
import { getTopics } from "@/lib/content";
import { getPrefs } from "@/lib/request";

export async function generateMetadata({ params }: PageProps<"/discover/[topic]">): Promise<Metadata> {
  const { topic } = await params;
  const t = (await getTopics()).find((x) => x.slug === topic);
  return t ? { title: `${t.label} — Bible passages`, description: t.description } : {};
}

export default async function TopicPage({ params }: PageProps<"/discover/[topic]">) {
  const { topic } = await params;
  const t = (await getTopics()).find((x) => x.slug === topic);
  if (!t) notFound();
  const [prefs, user] = await Promise.all([getPrefs(), getSessionUser()]);
  const passages = (await Promise.all(t.passages.map(async (p) => ({ note: p.note, passage: await resolvePassage(p.ref, prefs.edition) })))).filter((x) => x.passage);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/discover" className="text-sm text-muted underline">← Discover</Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">{t.label}</h1>
      <p className="mt-2 text-muted">{t.description}</p>
      <ul className="mt-8 space-y-6">
        {passages.map(({ note, passage }) => {
          const p = passage!;
          return (
            <li key={p.label} className="card p-6">
              <ScriptureQuote passage={p} size="md" />
              <p className="mt-3 text-sm text-muted"><span className="uppercase tracking-wider">Editorial note:</span> {note}</p>
              <div className="mt-3">
                <PassageActions
                  edition={p.edition.id}
                  book={p.ref.book}
                  chapter={p.ref.chapter}
                  verseStart={p.ref.verse ?? 1}
                  verseEnd={p.ref.endVerse ?? p.ref.verse ?? 1}
                  label={p.label}
                  text={p.text}
                  attribution={p.edition.license.attribution}
                  abbreviation={p.edition.abbreviation}
                  chapterHref={p.href}
                  shareKey={refKey(p.ref)}
                  canSave={Boolean(user?.emailVerified)}
                  compact
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
