/**
 * Instant placeholder shown while a page's data loads (route loading.tsx).
 * Next.js prefetches it ahead of time, so tapping a tab responds at once.
 */
export function PageSkeleton({ variant = "list" }: { variant?: "list" | "card" }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="skeleton h-7 w-40 rounded-lg" />
      {variant === "card" ? (
        <div className="skeleton mt-6 h-[min(64vh,560px)] rounded-[28px]" />
      ) : (
        <div className="mt-6 space-y-3">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-24 rounded-2xl" />
          <div className="skeleton h-24 rounded-2xl" />
          <div className="skeleton h-24 rounded-2xl" />
        </div>
      )}
    </div>
  );
}
