"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * A thin progress line at the top of the screen while an in-app link is
 * loading. It only appears if the page takes longer than ~120 ms, so instant
 * (prefetched) navigations show nothing extra. It never delays navigation.
 */
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams()?.toString() ?? "";
  const [visible, setVisible] = useState(false);
  const timer = useRef<number | null>(null);
  const failsafe = useRef<number | null>(null);

  // Navigation finished: hide.
  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (failsafe.current) window.clearTimeout(failsafe.current);
    timer.current = failsafe.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when the route changes
    setVisible(false);
  }, [pathname, search]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page / hash link
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setVisible(true), 120);
      if (failsafe.current) window.clearTimeout(failsafe.current);
      failsafe.current = window.setTimeout(() => setVisible(false), 12000);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return visible ? <div className="nav-progress" role="progressbar" aria-label="Loading page" /> : null;
}
