import { useId } from "react";

/**
 * Abide mark: an open Bible with a cross formed by its gutter, on an evergreen
 * tile, with gold page edges. Drawn as a vector from the supplied logo artwork
 * so it stays sharp at every size. Colors are fixed brand colors (not theme
 * tokens) so the mark looks the same in every theme.
 */
export function LogoMark({ className = "h-8 w-8", title }: { className?: string; title?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const half = `abide-half-${uid}`;
  const gold = `abide-gold-${uid}`;
  return (
    <svg viewBox="0 0 600 600" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <defs>
        <linearGradient id={gold} gradientUnits="userSpaceOnUse" x1="87" y1="440" x2="280" y2="480">
          <stop offset="0" stopColor="#e8c06e" />
          <stop offset=".6" stopColor="#e2b45e" />
          <stop offset="1" stopColor="#d29c3c" />
        </linearGradient>
        <g id={half}>
          <path d="M87 154Q87 143 98 142C160 134 238 150 281 196V478C240 432 170 400 87 410Z" fill="#fcf2e1" />
          <path d="M87 428C152 418 232 436 280 490C232 468 160 456 87 470Z" fill={`url(#${gold})`} />
        </g>
      </defs>
      <rect width="600" height="600" rx="148" fill="#093924" />
      <use href={`#${half}`} />
      <use href={`#${half}`} transform="matrix(-1 0 0 1 599 0)" />
      <rect x="206" y="260" width="187" height="36" fill="#093924" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className="h-8 w-8 shrink-0 drop-shadow-[0_1px_1px_rgba(9,57,36,0.18)]" />
      <span className="text-[1.35rem] font-bold tracking-[-0.03em] text-ink">Abide</span>
    </span>
  );
}
