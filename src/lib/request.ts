import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { dictionaries } from "./i18n/dictionaries";
import { parsePrefs, PREFS_COOKIE, type Locale, type Prefs } from "./prefs";

/** Request-scoped preferences (cookie) with Accept-Language fallback for locale. */
export const getPrefs = cache(async (): Promise<Prefs> => {
  const store = await cookies();
  const raw = store.get(PREFS_COOKIE)?.value;
  const prefs = parsePrefs(raw);
  if (!raw) {
    const lang = (await headers()).get("accept-language")?.toLowerCase() ?? "";
    const locale: Locale = lang.startsWith("fr") ? "fr" : lang.startsWith("ar") ? "ar" : "en";
    return { ...prefs, locale };
  }
  return prefs;
});

export async function getDictionary() {
  const prefs = await getPrefs();
  return { t: dictionaries[prefs.locale], locale: prefs.locale, dir: prefs.locale === "ar" ? "rtl" : "ltr" } as const;
}
