"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/annotations";
import { withUser } from "@/lib/actions-util";
import { getMedia } from "@/lib/content";

/** state: "none" removes; "want" adds; "watched" marks as watched (manual — no playback tracking). */
export async function setWatchState(slug: string, state: "none" | "want" | "watched"): Promise<ActionResult> {
  if (!(await getMedia()).some((m) => m.slug === slug)) return { ok: false, error: "Unknown title." };
  return withUser(async ({ supabase, user }) => {
    const { error } =
      state === "none"
        ? await supabase.from("watchlist").delete().eq("media_slug", slug)
        : await supabase.from("watchlist").upsert({ user_id: user.id, media_slug: slug, watched: state === "watched" });
    revalidatePath("/watch");
    return error ? { ok: false, error: "Could not update your watchlist." } : { ok: true };
  });
}
