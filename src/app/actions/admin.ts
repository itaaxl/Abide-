"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/annotations";
import { AuthError, requireAdmin } from "@/lib/auth";
import { authErrorMessage } from "@/lib/actions-util";
import { getEdition } from "@/lib/bible/provider";
import { parseRefKey } from "@/lib/bible/reference";
import { site } from "@/config/site";

/**
 * Admin writes. Authorization is checked here (server) AND by RLS policies
 * that call public.is_admin(). The admin role can only be granted with SQL by
 * the database owner — never through the app.
 */
const TABLES = { daily: "content_daily_verses", plan: "content_plans", topic: "content_topics", media: "content_media" } as const;
type Kind = keyof typeof TABLES;

async function validRef(key: string) {
  const ref = parseRefKey(key);
  const web = await getEdition(site.defaultEdition);
  const b = ref && web?.books.find((x) => x.id === ref.book);
  if (!ref || !b) return false;
  const max = b.chapters[ref.chapter - 1];
  return Boolean(max) && (ref.verse ?? 1) <= max && (ref.endVerse ?? 1) <= max;
}

const dailySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{3,40}$/),
  ref_key: z.string().max(30),
  topic: z.string().min(1).max(40),
  reflection: z.string().min(1).max(1200),
  prayer: z.string().max(600),
  question: z.string().max(400),
});
const planSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{3,60}$/),
  title: z.string().min(1).max(120),
  summary: z.string().max(120),
  description: z.string().max(1500),
  minutesPerDay: z.number().int().min(1).max(120),
  days: z.array(z.object({ refs: z.array(z.string().max(30)).min(1).max(5) })).min(1).max(400),
});
const topicSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{3,60}$/),
  label: z.string().min(1).max(80),
  description: z.string().max(300),
  keywords: z.array(z.string().max(40)).max(40),
  passages: z.array(z.object({ ref: z.string().max(30), note: z.string().max(300) })).min(1).max(30),
});
const mediaSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{3,60}$/),
  title: z.string().min(1).max(120),
  kind: z.enum(["series", "movie", "educational"]),
  description: z.string().min(1).max(800),
  provider: z.string().min(1).max(120),
  url: z.string().url().startsWith("https://"),
  access: z.enum(["external", "authorized-embed"]),
  embedUrl: z.string().url().startsWith("https://www.youtube-nocookie.com/").optional(),
  dramatized: z.boolean(),
  lastChecked: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function saveContent(kind: Kind, json: string, status: "draft" | "published"): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireAdmin();
    let data: unknown;
    try {
      data = JSON.parse(json);
    } catch {
      return { ok: false, error: "Invalid JSON." };
    }
    let row: Record<string, unknown>;
    let id: string;
    if (kind === "daily") {
      const p = dailySchema.safeParse(data);
      if (!p.success) return { ok: false, error: p.error.issues[0].message };
      if (!(await validRef(p.data.ref_key))) return { ok: false, error: `Reference ${p.data.ref_key} is not valid in the World English Bible.` };
      row = { ...p.data, status, updated_at: new Date().toISOString() };
      id = p.data.id;
    } else {
      const schema = kind === "plan" ? planSchema : kind === "topic" ? topicSchema : mediaSchema;
      const p = schema.safeParse(data);
      if (!p.success) return { ok: false, error: `${p.error.issues[0].path.join(".")}: ${p.error.issues[0].message}` };
      const refs =
        kind === "plan" ? (p.data as z.infer<typeof planSchema>).days.flatMap((d) => d.refs) : kind === "topic" ? (p.data as z.infer<typeof topicSchema>).passages.map((x) => x.ref) : [];
      for (const r of refs) if (!(await validRef(r))) return { ok: false, error: `Reference ${r} is not valid in the World English Bible.` };
      if (kind === "media" && (p.data as z.infer<typeof mediaSchema>).access === "authorized-embed" && !(p.data as z.infer<typeof mediaSchema>).embedUrl)
        return { ok: false, error: "Authorized embeds need an embedUrl (and documented permission)." };
      id = (p.data as { slug: string }).slug;
      row = { slug: id, data: p.data, status, updated_at: new Date().toISOString() };
    }
    const { error } = await supabase.from(TABLES[kind]).upsert(row);
    if (error) return { ok: false, error: "Database rejected the change." };
    await supabase.from("admin_audit").insert({ actor_id: user.id, entity: TABLES[kind], entity_id: id, action: `save:${status}` });
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof AuthError ? authErrorMessage(e) : "Failed." };
  }
}

export async function deleteContent(kind: Kind, id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireAdmin();
    const col = kind === "daily" ? "id" : "slug";
    const { error } = await supabase.from(TABLES[kind]).delete().eq(col, id);
    if (error) return { ok: false, error: "Could not delete." };
    await supabase.from("admin_audit").insert({ actor_id: user.id, entity: TABLES[kind], entity_id: id, action: "delete" });
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: authErrorMessage(e) };
  }
}
