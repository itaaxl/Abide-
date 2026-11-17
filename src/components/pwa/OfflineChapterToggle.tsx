"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { downloadChapter, isChapterSaved, offlineSupported, removeChapter } from "@/lib/offline";
import { useT } from "../LocaleProvider";

/** "Download for offline" / "Available offline · Remove" for one chapter. */
export function OfflineChapterToggle({
  path,
  label,
  book,
}: {
  path: string;
  label: string;
  /** Whole-book download: base path (/bible/ed/BOOK), chapter count, label prefix. */
  book?: { base: string; chapters: number; name: string; abbr: string };
}) {
  const T = useT();
  const [supported, setSupported] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    if (!offlineSupported()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser capability check after hydration
    setSupported(true);
    const check = () => void isChapterSaved(path).then(setSaved);
    check();
    window.addEventListener("abide-offline-change", check);
    return () => window.removeEventListener("abide-offline-change", check);
  }, [path]);

  if (!supported) return null;

  async function toggle() {
    setMenuOpen(false);
    setBusy(true);
    setMsg(null);
    try {
      if (saved) {
        await removeChapter(path);
        setSaved(false);
        setMsg(T("Removed from this device.", "Retiré de cet appareil.", "أُزيل من هذا الجهاز."));
      } else {
        await downloadChapter(path, label);
        setSaved(true);
        setMsg(T("Saved on this device for offline reading.", "Enregistré sur cet appareil pour lecture hors ligne.", "حُفظ على هذا الجهاز للقراءة دون اتصال."));
      }
    } catch {
      setMsg(
        navigator.onLine
          ? T("Couldn’t save this chapter. Please try again.", "Impossible d’enregistrer ce chapitre. Réessayez.", "تعذّر حفظ هذا الأصحاح. حاول مجددًا.")
          : T("You’re offline — downloading needs an internet connection.", "Vous êtes hors ligne — le téléchargement nécessite Internet.", "أنت غير متصل — التنزيل يحتاج إلى اتصال بالإنترنت."),
      );
    } finally {
      setBusy(false);
    }
  }

  async function downloadBook() {
    if (!book) return;
    setMenuOpen(false);
    cancelled.current = false;
    setMsg(null);
    setProgress({ done: 0, total: book.chapters });
    let failed = 0;
    for (let c = 1; c <= book.chapters; c++) {
      if (cancelled.current) break;
      const p = `${book.base}/${c}`;
      try {
        if (!(await isChapterSaved(p))) await downloadChapter(p, `${book.name} ${c} · ${book.abbr}`);
      } catch {
        failed++;
        if (!navigator.onLine) break;
      }
      setProgress({ done: c, total: book.chapters });
    }
    setProgress(null);
    setSaved(await isChapterSaved(path));
    setMsg(
      cancelled.current
        ? T("Stopped. Chapters already saved stay available.", "Arrêté. Les chapitres déjà enregistrés restent disponibles.", "توقّف التنزيل. تبقى الأصحاحات المحفوظة متاحة.")
        : failed
          ? T(`${failed} chapters couldn’t be saved. Try again later.`, `${failed} chapitres n’ont pas pu être enregistrés. Réessayez plus tard.`, `تعذّر حفظ ${failed} أصحاحات. حاول لاحقًا.`)
          : T(`${book.name} is saved for offline reading.`, `${book.name} est enregistré pour la lecture hors ligne.`, `حُفظ ${book.name} للقراءة دون اتصال.`),
    );
  }

  return (
    <div className="reader-secondary relative flex flex-wrap items-center gap-2">
      <details className="group relative" open={menuOpen} onToggle={(e) => setMenuOpen((e.target as HTMLDetailsElement).open)}>
        <summary
          className={`btn btn-sm list-none [&::-webkit-details-marker]:hidden ${saved ? "border-gold/50 bg-gold-soft/60 text-gold" : ""}`}
          aria-label={saved ? T("Available offline — options", "Disponible hors ligne — options", "متاح دون اتصال — خيارات") : T("Offline options", "Options hors ligne", "خيارات دون اتصال")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {saved ? <path d="m5 12 4.5 4.5L19 7" /> : <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />}
          </svg>
          {saved ? T("Available offline", "Disponible hors ligne", "متاح دون اتصال") : T("Offline", "Hors ligne", "دون اتصال")}
        </summary>
        <div className="absolute end-0 top-full z-30 mt-2 flex w-60 flex-col gap-1 rounded-2xl border border-rule bg-surface p-2 shadow-lg">
          <button type="button" className="btn btn-sm btn-ghost justify-start" onClick={toggle} disabled={busy} aria-busy={busy}>
            {saved ? T("Remove download", "Retirer le téléchargement", "إزالة التنزيل") : T("Download for offline", "Télécharger hors ligne", "نزّل للقراءة دون اتصال")}
          </button>
          {book && book.chapters > 1 && (
            <button type="button" className="btn btn-sm btn-ghost justify-start" onClick={downloadBook} disabled={busy || progress !== null}>
              {T("Whole book", "Livre entier", "السفر كاملًا")} ({book.chapters})
            </button>
          )}
          <Link href="/offline" className="btn btn-sm btn-ghost justify-start">
            {T("Manage downloads", "Gérer les téléchargements", "إدارة التنزيلات")}
          </Link>
        </div>
      </details>
      {progress && (
        <span className="flex items-center gap-2 text-xs text-muted">
          <progress max={progress.total} value={progress.done} className="h-1.5 w-20 accent-[var(--gold)]" aria-label={T("Downloading book", "Téléchargement du livre", "جارٍ تنزيل السفر")} />
          {progress.done}/{progress.total}
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => (cancelled.current = true)}>
            {T("Stop", "Arrêter", "إيقاف")}
          </button>
        </span>
      )}
      <span role="status" className={msg && progress === null && msg.length > 40 ? "w-full text-end text-xs text-muted" : "sr-only"}>
        {msg}
      </span>
    </div>
  );
}
