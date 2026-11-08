/**
 * Only allow same-site relative return destinations from an allowlist of
 * sections. Anything else falls back to "/". Prevents open redirects in
 * auth callbacks.
 */
const ALLOWED_PREFIXES = [
  "/",
  "/bible",
  "/daily",
  "/flashcards",
  "/plans",
  "/guidance",
  "/watch",
  "/library",
  "/journal",
  "/discover",
  "/account",
  "/auth/reset",
  "/search",
  "/admin",
];

export function safeNext(raw: string | null | undefined, fallback = "/"): string {
  if (!raw || typeof raw !== "string") return fallback;
  let path: string;
  try {
    // Resolve against a dummy origin; reject anything that changes origin.
    const u = new URL(raw, "https://example.invalid");
    if (u.origin !== "https://example.invalid") return fallback;
    path = u.pathname + u.search + u.hash;
  } catch {
    return fallback;
  }
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return fallback;
  const ok = ALLOWED_PREFIXES.some((p) => (p === "/" ? path === "/" || path.startsWith("/?") : path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`)));
  return ok ? path : fallback;
}
