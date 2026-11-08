"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/annotations";
import { withUser } from "@/lib/actions-util";

export async function deleteHighlight(id: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid id." };
  return withUser(async ({ supabase }) => {
    const { error } = await supabase.from("highlights").delete().eq("id", id);
    return error ? { ok: false, error: "Could not delete." } : { ok: true };
  });
}
