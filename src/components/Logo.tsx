/** Original mark: an open book with a slender cross rising from its spine. */
export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="none">
      <path d="M16 4v9" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12.5 7.5h7" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M16 27c-3-2.2-7-3-12-2.6V12.6C9 12.2 13 13 16 15.4c3-2.4 7-3.2 12-2.8v11.8c-5-.4-9 .4-12 2.6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M16 15.4V27" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
