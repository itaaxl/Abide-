"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listChapters, offlineSupported, removeAll, removeChapter, type OfflineEntry } from "@/lib/offline";
import { useT } from "../LocaleProvider";

/** Chapters saved on this device, with open/remove controls. */
export function OfflineList() {
  const T = useT();
  const [items, setItems] = useState<OfflineEntry[] | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!offlineSupported()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- browser capability check after hydration
      setSupported(false);
      return;
    }
    const load = () => void listChapters().then(setItems);
    load();
    window.addEventListener("abide-offline-change", load);
    return () => window.removeEventListener("abide-offline-change", load);
  }, []);

  if (!supported) return <p className="text-muted">{T("This browser doesn’t support offline downloads.", "Ce navigateur ne permet pas les téléchargements hors ligne.", "هذا المتصفح لا يدعم التنزيل دون اتصال.")}</p>;
  if (!items) return <p className="text-muted">{T("Loading…", "Chargement…", "جارٍ التحميل…")}</p>;
  if (!items.length)
    return (
      <p className="text-muted">
        {T("No chapters downloaded yet. Open a chapter in the ", "Aucun chapitre téléchargé. Ouvrez un chapitre dans le ", "لا أصحاحات منزّلة بعد. افتح أصحاحًا في ")}
        <Link href="/bible" className="underline">
          {T("Bible reader", "lecteur biblique", "قارئ الكتاب المقدس")}
        </Link>
        {T(" and press “Download for offline”.", " et appuyez sur « Télécharger hors ligne ».", " واضغط «نزّل للقراءة دون اتصال».")}
      </p>
    );

  return (
    <div>
      <ul className="divide-y divide-rule rounded-2xl border border-rule bg-surface">
        {items.map((it) => (
          <li key={it.path} className="flex items-center justify-between gap-3 px-4 py-3">
            <Link href={it.path} className="min-w-0 truncate font-semibold hover:underline">
              {it.label}
            </Link>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => void removeChapter(it.path)}>
              {T("Remove", "Retirer", "إزالة")}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn-sm mt-3" onClick={() => confirm(T("Remove all offline chapters from this device?", "Retirer tous les chapitres hors ligne de cet appareil ?", "إزالة كل الأصحاحات المنزّلة من هذا الجهاز؟")) && void removeAll()}>
        {T("Remove all downloads", "Tout retirer", "إزالة كل التنزيلات")}
      </button>
    </div>
  );
}
