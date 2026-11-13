"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { downloadChapter, isChapterSaved, offlineSupported, removeChapter } from "@/lib/offline";

/** "Download for offline" / "Available offline · Remove" for one chapter. */
export function OfflineChapterToggle({ path, label }: { path: string; label: string }) {
  const [supported, setSupported] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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
    setBusy(true);
    setMsg(null);
    try {
      if (saved) {
        await removeChapter(path);
        setSaved(false);
        setMsg("Removed from this device.");
      } else {
        await downloadChapter(path, label);
        setSaved(true);
        setMsg("Saved on this device for offline reading.");
      }
    } catch {
      setMsg(navigator.onLine ? "Couldn’t save this chapter. Please try again." : "You’re offline — downloading needs an internet connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="reader-secondary flex flex-wrap items-center gap-2">
      {saved && (
        <Link href="/offline" className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-1 text-xs font-semibold text-gold">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m5 12 4.5 4.5L19 7" />
          </svg>
          Available offline
        </Link>
      )}
      <button type="button" className="btn btn-sm" onClick={toggle} disabled={busy} aria-busy={busy}>
        {saved ? "Remove download" : "Download for offline"}
      </button>
      <span role="status" className="sr-only">{msg}</span>
    </div>
  );
}
