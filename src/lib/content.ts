import "server-only";
import { DAILY_VERSES, type DailyVerseEntry } from "@/content/daily-verses";
import { PLANS, type ReadingPlan } from "@/content/plans";
import { TOPICS, type Topic } from "@/content/topics";
import { MEDIA, type MediaEntry } from "@/content/media";
import { createClient } from "./supabase/server";

/**
 * Curated content repository. Published rows in the database (managed in the
 * admin area) take precedence over, and extend, the version-controlled seed
 * content. Without a database the seed content is used as-is.
 */
async function fromDb<T>(table: string, map: (row: Record<string, unknown>) => T): Promise<T[] | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from(table).select("*").eq("status", "published");
  if (error || !data) return null;
  return data.map(map);
}

function merge<T>(seed: T[], db: T[] | null, key: (t: T) => string): T[] {
  if (!db?.length) return seed;
  const byKey = new Map(seed.map((s) => [key(s), s]));
  for (const d of db) byKey.set(key(d), d);
  return [...byKey.values()];
}

export async function getDailyVerses(): Promise<DailyVerseEntry[]> {
  const db = await fromDb("content_daily_verses", (r) => ({
    id: String(r.id),
    ref: String(r.ref_key),
    topic: String(r.topic),
    phrase: r.phrase ? String(r.phrase) : (DAILY_VERSES.find((d) => d.id === String(r.id))?.phrase ?? String(r.reflection).split(/(?<=[.!?])\s/)[0]),
    reflection: String(r.reflection),
    prayer: String(r.prayer ?? ""),
    question: String(r.question ?? ""),
  }));
  return merge(DAILY_VERSES, db, (d) => d.id).sort((a, b) => a.id.localeCompare(b.id));
}

export async function getPlans(): Promise<ReadingPlan[]> {
  const db = await fromDb("content_plans", (r) => ({ ...(r.data as ReadingPlan), slug: String(r.slug) }));
  return merge(PLANS, db, (p) => p.slug);
}

export async function getTopics(): Promise<Topic[]> {
  const db = await fromDb("content_topics", (r) => ({ ...(r.data as Topic), slug: String(r.slug) }));
  return merge(TOPICS, db, (t) => t.slug);
}

export async function getMedia(): Promise<MediaEntry[]> {
  const db = await fromDb("content_media", (r) => ({ ...(r.data as MediaEntry), slug: String(r.slug) }));
  return merge(MEDIA, db, (m) => m.slug);
}
