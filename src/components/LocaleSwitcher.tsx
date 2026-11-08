import { setLocale } from "@/app/actions/prefs";
import type { Locale } from "@/lib/prefs";

const NAMES: Record<Locale, string> = { en: "English", fr: "Français", ar: "العربية" };

/** Interface language only — Scripture language is chosen with the translation. */
export function LocaleSwitcher({ current }: { current: Locale }) {
  return (
    <form action={setLocale} className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-wider">Interface · Langue · اللغة</span>
      <div className="flex gap-1" role="group" aria-label="Interface language">
        {(Object.keys(NAMES) as Locale[]).map((l) => (
          <button
            key={l}
            name="locale"
            value={l}
            lang={l}
            aria-pressed={l === current}
            className={`btn btn-sm ${l === current ? "btn-primary" : ""}`}
          >
            {NAMES[l]}
          </button>
        ))}
      </div>
    </form>
  );
}
