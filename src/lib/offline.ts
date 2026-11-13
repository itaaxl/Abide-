/**
 * Explicit offline downloads of Bible chapters (browser only).
 *
 * Chapters are fetched WITHOUT cookies, so the stored copy is the public
 * version of the page: no highlights, notes, account details or preferences.
 * Only chapter pages and the public build assets they need are stored.
 * Cache names must match public/sw.js.
 */
export const BIBLE_CACHE = "abide-bible-v1";
export const SHELL_CACHE = "abide-shell-v1";
const INDEX_KEY = "abide:offline-index";
const CHAPTER = /^\/bible\/[a-z]{3}-[a-z0-9-]+\/[1-3A-Z]{3}\/\d+$/;

export interface OfflineEntry {
  path: string;
  label: string;
  savedAt: number;
}

export function offlineSupported(): boolean {
  return typeof window !== "undefined" && "caches" in window && "serviceWorker" in navigator;
}

function readIndex(): Record<string, OfflineEntry> {
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY) ?? "{}") as Record<string, OfflineEntry>;
  } catch {
    return {};
  }
}
function writeIndex(idx: Record<string, OfflineEntry>) {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(idx));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("abide-offline-change"));
}

const keyFor = (path: string) => `${location.origin}${path}`;

/** Public build assets referenced by a page (scripts, styles, fonts). */
async function cacheAssets(html: string) {
  const shell = await caches.open(SHELL_CACHE);
  const urls = new Set(html.match(/\/_next\/static\/[^"'\s)<>\\]+/g) ?? []);
  for (const u of [...urls]) {
    if (await shell.match(u)) continue;
    try {
      const res = await fetch(u, { credentials: "omit" });
      if (!res.ok) continue;
      if (u.endsWith(".css")) {
        const css = await res.clone().text();
        for (const f of css.match(/\/_next\/static\/media\/[^"')\s]+/g) ?? []) {
          if (!(await shell.match(f))) {
            const fr = await fetch(f, { credentials: "omit" });
            if (fr.ok) await shell.put(f, fr);
          }
        }
      }
      await shell.put(u, res);
    } catch {
      /* best effort */
    }
  }
  for (const u of ["/offline", "/brand/abide-icon-96.png", "/manifest.webmanifest"]) {
    if (await shell.match(u)) continue;
    try {
      const res = await fetch(u, { credentials: "omit" });
      if (res.ok) await shell.put(u, res);
    } catch {
      /* ignore */
    }
  }
}

export async function downloadChapter(path: string, label: string): Promise<void> {
  if (!CHAPTER.test(path)) throw new Error("not a chapter");
  const res = await fetch(path, { credentials: "omit", cache: "no-store" });
  if (!res.ok || res.redirected) throw new Error(`status ${res.status}`);
  const html = await res.clone().text();
  await (await caches.open(BIBLE_CACHE)).put(keyFor(path), res);
  await cacheAssets(html);
  writeIndex({ ...readIndex(), [path]: { path, label, savedAt: Date.now() } });
}

export async function removeChapter(path: string): Promise<void> {
  await (await caches.open(BIBLE_CACHE)).delete(keyFor(path));
  const idx = readIndex();
  delete idx[path];
  writeIndex(idx);
}

export async function isChapterSaved(path: string): Promise<boolean> {
  if (!offlineSupported()) return false;
  return Boolean(await (await caches.open(BIBLE_CACHE)).match(keyFor(path)));
}

/** Downloaded chapters (cache is the source of truth; the index adds labels). */
export async function listChapters(): Promise<OfflineEntry[]> {
  if (!offlineSupported()) return [];
  const idx = readIndex();
  const keys = await (await caches.open(BIBLE_CACHE)).keys();
  return keys
    .map((r) => new URL(r.url).pathname)
    .map((p) => idx[p] ?? { path: p, label: p.split("/").slice(3).join(" "), savedAt: 0 })
    .sort((a, b) => b.savedAt - a.savedAt);
}

export async function removeAll(): Promise<void> {
  await caches.delete(BIBLE_CACHE);
  writeIndex({});
}
