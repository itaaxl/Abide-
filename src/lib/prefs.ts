import { z } from "zod";

/**
 * Reading preferences. Guests keep them in a first-party cookie so the server
 * can render the right theme without a flash. Signed-in users also store them
 * in their profile.
 *
 * Conflict rule (documented in docs/ARCHITECTURE.md): when a user signs in,
 * saved account preferences replace the device cookie. Afterwards every
 * change is written to both, so the most recent explicit change wins.
 */
export const THEMES = ["light", "sepia", "dark"] as const;
export const LAYOUTS = ["paragraph", "verse"] as const;
export const WIDTHS = ["narrow", "medium", "wide"] as const;
export const LOCALES = ["en", "fr", "ar"] as const;

export type Locale = (typeof LOCALES)[number];

export const prefsSchema = z.object({
  theme: z.enum(THEMES).catch("light"),
  fontSize: z.number().int().min(14).max(30).catch(19),
  lineHeight: z.number().min(1.4).max(2.2).catch(1.75),
  width: z.enum(WIDTHS).catch("medium"),
  layout: z.enum(LAYOUTS).catch("paragraph"),
  edition: z.string().regex(/^[a-z]{3}-[a-z0-9-]+$/).catch("eng-web"),
  locale: z.enum(LOCALES).catch("en"),
  showNotes: z.boolean().catch(true),
  showVerseNumbers: z.boolean().catch(true),
  timezone: z.string().max(64).catch("UTC"),
});

export type Prefs = z.infer<typeof prefsSchema>;

export const DEFAULT_PREFS: Prefs = prefsSchema.parse({});

export const PREFS_COOKIE = "abide_prefs";

export function parsePrefs(raw: string | undefined | null): Prefs {
  if (!raw) return DEFAULT_PREFS;
  try {
    return prefsSchema.parse({ ...DEFAULT_PREFS, ...JSON.parse(decodeURIComponent(raw)) });
  } catch {
    return DEFAULT_PREFS;
  }
}

export function serializePrefs(p: Prefs): string {
  return encodeURIComponent(JSON.stringify(p));
}

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
