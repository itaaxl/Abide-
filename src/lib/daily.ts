import "server-only";
import { getDailyVerses } from "./content";
import { daysBetween, localDate, safeTimezone } from "./time";
import { getPrefs } from "./request";
import { getSessionUser } from "./auth";
import { createClient } from "./supabase/server";

/**
 * Daily verse selection.
 *
 * The passage for a local date D is entry[(days since 2026-01-01) mod N]
 * from the id-sorted rotation, so every page and every device agrees.
 * Timezone: a signed-in user's profile timezone; otherwise the timezone
 * stored in the preferences cookie (set from the browser on first visit);
 * otherwise UTC — the documented guest default.
 */
export const ROTATION_EPOCH = "2026-01-01";

export async function getUserTimezone(): Promise<string> {
  const user = await getSessionUser();
  if (user) {
    const supabase = await createClient();
    const { data } = (await supabase?.from("profiles").select("timezone").eq("id", user.id).maybeSingle()) ?? {};
    if (data?.timezone) return safeTimezone(data.timezone);
  }
  return safeTimezone((await getPrefs()).timezone);
}

export async function todayFor(): Promise<{ date: string; timezone: string }> {
  const timezone = await getUserTimezone();
  return { date: localDate(new Date(), timezone), timezone };
}

export async function dailyEntryFor(date: string) {
  const list = await getDailyVerses();
  const n = list.length;
  const idx = ((daysBetween(ROTATION_EPOCH, date) % n) + n) % n;
  return list[idx];
}

export const isIsoDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
