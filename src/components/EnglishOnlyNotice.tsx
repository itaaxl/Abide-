import { getT } from "@/lib/request";

/** Shown at the top of long informational pages that are only available in English. */
export async function EnglishOnlyNotice() {
  const { T, locale } = await getT();
  if (locale === "en") return null;
  return (
    <p className="not-prose mb-6 rounded-lg border border-rule bg-gold-soft/30 p-3 text-sm" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      {T("", "Cette page n’est disponible qu’en anglais pour le moment.", "هذه الصفحة متاحة بالإنجليزية فقط حاليًا.")}
    </p>
  );
}
