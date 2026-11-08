/**
 * Optional: mirror the validated Bible editions from data/bibles into the
 * bible_* tables (for SQL access or a future database-backed provider).
 * The app itself reads the versioned files and does not require this.
 * Idempotent: rows are upserted by primary key.
 *
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SECRET_KEY=... npm run db:import-bible [-- eng-web]
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { CorpusRow, EditionMeta } from "../src/lib/bible/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (service role).");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });
const ROOT = path.resolve(__dirname, "..");

async function importEdition(id: string) {
  const e = JSON.parse(readFileSync(path.join(ROOT, "data/bibles", id, "edition.json"), "utf8")) as EditionMeta;
  const corpus = JSON.parse(readFileSync(path.join(ROOT, "data/bibles", id, "corpus.json"), "utf8")) as CorpusRow[];
  let r = await db.from("bible_editions").upsert({ id: e.id, name: e.name, abbreviation: e.abbreviation, language: e.language, direction: e.direction, license: e.license, source: e.source });
  if (r.error) throw r.error;
  r = await db.from("bible_books").upsert(
    e.books.map((b) => ({ edition_id: e.id, book: b.id, name: b.name, collection: b.collection, sort_order: b.order, chapter_verse_counts: b.chapters })),
  );
  if (r.error) throw r.error;
  for (let i = 0; i < corpus.length; i += 1000) {
    const batch = corpus.slice(i, i + 1000).map(([bi, chapter, verse, text]) => ({ edition_id: e.id, book: e.books[bi].id, chapter, verse, text }));
    r = await db.from("bible_verses").upsert(batch);
    if (r.error) throw r.error;
    process.stdout.write(`\r${id}: ${Math.min(i + 1000, corpus.length)}/${corpus.length}`);
  }
  console.log(`\n${id}: done`);
}

async function main() {
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : (JSON.parse(readFileSync(path.join(ROOT, "data/bibles/index.json"), "utf8")) as string[]);
  for (const id of ids) await importEdition(id);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
