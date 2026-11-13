"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Small notice while offline, saying what still works. */
export function NetworkStatus() {
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
      You’re offline. <Link href="/offline" className="font-semibold underline">Downloaded chapters</Link> still open; search, verse cards, guidance, and your
      account need an internet connection.
    </div>
  );
}
