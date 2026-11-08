import type { Metadata } from "next";
import Link from "next/link";
import { listEditions } from "@/lib/bible/provider";

export const metadata: Metadata = { title: "Bible editions" };

export default async function EditionsPage() {
  const editions = await listEditions();
  return (
    <article className="prose-page mx-auto max-w-3xl px-4 py-12">
      <h1>Bible editions</h1>
      <p>
        Only complete editions whose rights we have verified are offered. Each was imported from its publisher’s official files and checked verse
        by verse against the publisher’s plain-text export.
      </p>
      {editions.map((e) => (
        <section key={e.id} className="card my-6 p-6">
          <h2 className="!mt-0" dir={e.direction}>{e.name} ({e.abbreviation})</h2>
          <ul>
            <li>Language: {e.languageName} · edition id <code>{e.id}</code> · text direction {e.direction.toUpperCase()}</li>
            <li>Contents: {e.stats.books} books, {e.stats.chapters.toLocaleString()} chapters, {e.stats.verses.toLocaleString()} verses. {e.canonDescription}</li>
            <li>Rights: <strong>{e.license.status}</strong>. {e.license.summary}</li>
            <li>Source: <a href={e.source.url}>{e.source.publisher}</a> (retrieved {e.source.retrievedAt.slice(0, 10)}), <a href={e.license.copyrightUrl}>copyright page</a></li>
            <li>Attribution used when copying: “{e.license.attribution}”</li>
            <li>Psalm titles: {e.psalmTitles === "verse-one" ? "counted as verse 1 (numbering differs from English Bibles)" : "printed separately before verse 1"}</li>
          </ul>
          <Link href={`/bible/${e.id}`}>Browse books →</Link>
        </section>
      ))}
      <h2>Not yet available</h2>
      <p>
        Modern copyrighted translations (for example NIV, ESV, or newer French and Arabic versions) require licences and are not offered. The code is
        ready to add licensed editions through a provider such as API.Bible once agreements are in place.
      </p>
    </article>
  );
}
