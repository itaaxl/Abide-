import type { Metadata } from "next";
import Link from "next/link";
import { getTopics } from "@/lib/content";

export const metadata: Metadata = { title: "Discover", description: "Curated Bible passages on hope, peace, forgiveness, love, wisdom, courage and more." };

export default async function DiscoverPage() {
  const topics = await getTopics();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Discover</h1>
      <p className="mt-3 max-w-2xl text-muted">Passages gathered by theme. Each list was chosen by people (not AI); the short notes are editorial summaries, not Scripture.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((t) => (
          <li key={t.slug}>
            <Link href={`/discover/${t.slug}`} className="card block h-full p-5 hover:border-gold">
              <h2 className="text-lg font-semibold tracking-tight">{t.label}</h2>
              <p className="mt-1 text-sm text-muted">{t.description}</p>
              <p className="mt-3 text-xs text-gold">{t.passages.length} passages</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
