/*
 * Abide service worker — install support and basic offline reading.
 *
 * Privacy rule: this worker caches PUBLIC content only, from an explicit
 * allow-list:
 *   - build assets under /_next/static/ (immutable, public),
 *   - brand icons and the manifest,
 *   - the /offline page (fetched without cookies),
 *   - Bible chapters the reader explicitly downloads (stored by the page,
 *     also fetched without cookies so no account data is ever included).
 * Account pages, journals, library, flashcards, guidance, auth, server
 * actions, API routes and every non-GET request always go to the network
 * and are never stored.
 */
const VERSION = "v1";
const SHELL = `abide-shell-${VERSION}`;
const BIBLE = "abide-bible-v1"; // stable name: downloads survive app updates
const OFFLINE_URL = "/offline";
const CHAPTER = /^\/bible\/[a-z]{3}-[a-z0-9-]+\/[1-3A-Z]{3}\/\d+$/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      for (const url of [OFFLINE_URL, "/manifest.webmanifest", "/brand/abide-icon-192.png", "/brand/abide-icon-96.png"]) {
        try {
          const res = await fetch(url, { credentials: "omit", cache: "reload" });
          if (res.ok) await cache.put(url, res);
        } catch {
          /* offline during install: try again next time */
        }
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key.startsWith("abide-shell-") && key !== SHELL) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

function isStaticAsset(url) {
  return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/brand/") || url.pathname === "/manifest.webmanifest";
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // server actions, forms, AI: never touched
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Public build assets: cache-first (they are content-hashed and immutable).
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const hit = await caches.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok && res.type === "basic") (await caches.open(SHELL)).put(req, res.clone());
        return res;
      })(),
    );
    return;
  }

  // Page loads: always the network (fresh and personal). Only when offline,
  // fall back to an explicitly downloaded chapter, then the offline page.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(req);
        } catch {
          if (CHAPTER.test(url.pathname)) {
            const saved = await (await caches.open(BIBLE)).match(url.origin + url.pathname);
            if (saved) return saved;
          }
          return (await caches.match(OFFLINE_URL)) || new Response("You are offline.", { status: 503, headers: { "content-type": "text/plain" } });
        }
      })(),
    );
  }
  // Everything else (RSC data, API, auth, account pages): network only.
});
