"use client";

import { useEffect } from "react";

/** Registers the service worker (production only). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* install/offline features simply stay unavailable */
    });
  }, []);
  return null;
}
