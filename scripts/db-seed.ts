/**
 * Idempotently seeds curated content (daily verses, plans, topics, media)
 * into Supabase so admins can manage it. Safe to re-run: rows are upserted
 * by id/slug and existing admin edits with the same id ARE overwritten only
 * when --force is passed.
 *
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SECRET_KEY=... npm run db:seed [-- --force]
 */
import { createClient } from "@supabase/supabase-js";
import { DAILY_VERSES } from "../src/content/daily-verses";
import { MEDIA } from "../src/content/media";
import { PLANS } from "../src/content/plans";
import { TOPICS } from "../src/content/topics";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (service role).");
  process.exit(1);
}
const force = process.argv.includes("--force");
const db = createClient(url, key, { auth: { persistSession: false } });

async function upsert(table: string, rows: Record<string, unknown>[], key: string) {
  const { error } = await db.from(table).upsert(rows, { onConflict: key, ignoreDuplicates: !force });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`${table}: ${rows.length} rows ${force ? "upserted" : "inserted if missing"}`);
}

async function main() {
  await upsert(
    "content_daily_verses",
    DAILY_VERSES.map((d) => ({ id: d.id, ref_key: d.ref, topic: d.topic, phrase: d.phrase, reflection: d.reflection, prayer: d.prayer, question: d.question, status: "published" })),
    "id",
  );
  await upsert("content_plans", PLANS.map((p) => ({ slug: p.slug, data: p, status: "published" })), "slug");
  await upsert("content_topics", TOPICS.map((t) => ({ slug: t.slug, data: t, status: "published" })), "slug");
  await upsert("content_media", MEDIA.map((m) => ({ slug: m.slug, data: m, status: "published" })), "slug");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
