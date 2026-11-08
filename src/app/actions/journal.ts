"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/annotations";
import { withUser } from "@/lib/actions-util";

/**
 * Journal entries are private records. They are never sent to the AI
 * provider, never logged, and only readable by their owner (RLS).
 */
const entrySchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Give the entry a short title.").max(140),
  body: z.string().max(20000),
  refs: z.array(z.string().trim().min(1).max(40)).max(20),
  tags: z.array(z.string().trim().min(1).max(30)).max(10),
  status: z.enum(["ongoing", "answered", "reflection"]),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type EntryInput = z.infer<typeof entrySchema>;

export async function saveEntry(input: EntryInput): Promise<ActionResult<{ id: string }>> {
  const p = entrySchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const v = p.data;
  return withUser(async ({ supabase, user }) => {
    const row = {
      title: v.title,
      body: v.body,
      refs: [...new Set(v.refs)],
      tags: [...new Set(v.tags)],
      status: v.status,
      entry_date: v.entryDate,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = v.id
      ? await supabase.from("prayer_entries").update(row).eq("id", v.id).select("id").single()
      : await supabase.from("prayer_entries").insert({ ...row, user_id: user.id }).select("id").single();
    if (error) return { ok: false, error: "Could not save the entry. Your text is still here — please try again." };
    revalidatePath("/journal");
    return { ok: true, data: { id: data.id } };
  });
}

export async function setEntryStatus(id: string, status: "ongoing" | "answered" | "reflection"): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid id." };
  return withUser(async ({ supabase }) => {
    const { error } = await supabase.from("prayer_entries").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    revalidatePath("/journal");
    return error ? { ok: false, error: "Could not update." } : { ok: true };
  });
}

export async function deleteEntry(id: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid id." };
  return withUser(async ({ supabase }) => {
    const { error } = await supabase.from("prayer_entries").delete().eq("id", id);
    revalidatePath("/journal");
    return error ? { ok: false, error: "Could not delete." } : { ok: true };
  });
}
