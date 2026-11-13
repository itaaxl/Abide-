"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listChapters, offlineSupported, removeAll, removeChapter, type OfflineEntry } from "@/lib/offline";

/** Chapters saved on this device, with open/remove controls. */
export function OfflineList() {
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

  if (!supported) return <p className="text-muted">This browser doesn’t support offline downloads.</p>;
  if (!items) return <p className="text-muted">Loading…</p>;
  if (!items.length)
    return (
      <p className="text-muted">
        No chapters downloaded yet. Open a chapter in the <Link href="/bible" className="underline">Bible reader</Link> and press “Download for offline”.
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
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn-sm mt-3" onClick={() => confirm("Remove all offline chapters from this device?") && void removeAll()}>
        Remove all downloads
      </button>
    </div>
  );
}
