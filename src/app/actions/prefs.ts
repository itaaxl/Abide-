"use server";

import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth";
import { isValidTimezone, parsePrefs, PREFS_COOKIE, prefsSchema, serializePrefs, type Prefs } from "@/lib/prefs";
import { createClient } from "@/lib/supabase/server";

/**
 * Update reading/interface preferences. Writes the device cookie and, for a
 * signed-in user, their profile (most recent explicit change wins).
 */
export async function updatePrefs(patch: Partial<Prefs>): Promise<Prefs> {
  const store = await cookies();
  const current = parsePrefs(store.get(PREFS_COOKIE)?.value);
  const merged = prefsSchema.parse({ ...current, ...patch });
  if (patch.timezone && !isValidTimezone(patch.timezone)) merged.timezone = current.timezone;
  store.set(PREFS_COOKIE, serializePrefs(merged), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
  });
  const user = await getSessionUser();
  if (user?.emailVerified) {
    const supabase = await createClient();
    await supabase?.from("profiles").update({ preferences: merged, updated_at: new Date().toISOString() }).eq("id", user.id);
  }
  return merged;
}

export async function setLocale(formData: FormData) {
  const locale = String(formData.get("locale"));
  if (locale === "en" || locale === "fr" || locale === "ar") await updatePrefs({ locale });
}
