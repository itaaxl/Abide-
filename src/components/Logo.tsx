/**
 * Abide mark: an arched doorway (to abide = to dwell) with a cross set inside.
 * Original artwork; a solid silhouette so it stays recognizable at 16px.
 */
export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M5 29V14.5C5 8.15 9.92 3 16 3s11 5.15 11 11.5V29Z" fill="var(--gold)" />
      <rect x="14.6" y="9" width="2.8" height="15" rx="1.4" fill="var(--paper)" />
      <rect x="10.5" y="13.4" width="11" height="2.8" rx="1.4" fill="var(--paper)" />
      <rect x="3" y="28" width="26" height="2" rx="1" fill="var(--warm)" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="text-[1.35rem] font-bold tracking-[-0.03em] text-ink">Abide</span>
    </span>
  );
}
