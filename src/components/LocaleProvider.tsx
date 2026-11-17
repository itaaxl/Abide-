"use client";

import { createContext, useContext } from "react";
import { translateMessage } from "@/lib/i18n/messages";
import { tri, type Translate } from "@/lib/i18n/tri";
import type { Locale } from "@/lib/prefs";

const Ctx = createContext<Locale>("en");

/** Makes the interface language available to client components. */
export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <Ctx.Provider value={locale}>{children}</Ctx.Provider>;
}

export function useLocale(): Locale {
  return useContext(Ctx);
}

/** Translates a server message (English) into the interface language. */
export function useMsg(): (msg: string | null | undefined) => string {
  const locale = useContext(Ctx);
  return (msg) => translateMessage(msg, locale);
}

/** Client-side translator: const T = useT(); T("Save", "Enregistrer", "حفظ"). */
export function useT(): Translate {
  return tri(useContext(Ctx));
}
