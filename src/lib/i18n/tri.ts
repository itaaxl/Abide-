import type { Locale } from "../prefs";

/** A tiny inline translator: T("English", "Français", "العربية"). */
export type Translate = (en: string, fr: string, ar: string) => string;

export function tri(locale: Locale): Translate {
  return (en, fr, ar) => (locale === "fr" ? fr : locale === "ar" ? ar : en);
}
