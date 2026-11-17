"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useT } from "../LocaleProvider";

/** Small notice while offline, saying what still works. */
export function NetworkStatus() {
  const T = useT();
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="no-print border-b border-rule bg-gold-soft/60 px-4 py-2 text-center text-sm">
      {T("You’re offline. ", "Vous êtes hors ligne. ", "أنت غير متصل. ")}
      <Link href="/offline" className="font-semibold underline">
        {T("Downloaded chapters", "Les chapitres téléchargés", "الأصحاحات المنزّلة")}
      </Link>
      {T(
        " still open; search, verse cards, guidance, and your account need an internet connection.",
        " restent accessibles ; la recherche, les cartes, l’aide et votre compte nécessitent Internet.",
        " ما زالت تُفتح؛ البحث والبطاقات والإرشاد وحسابك تحتاج إلى اتصال بالإنترنت.",
      )}
    </div>
  );
}
