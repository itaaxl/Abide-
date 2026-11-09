"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type Key = "bible" | "flashcards" | "guidance" | "plans" | "watch" | "library" | "journal" | "discover";

const ITEMS: { key: Key; href: string; match: RegExp; icon: React.ReactNode }[] = [
  {
    key: "bible",
    href: "/bible",
    match: /^\/($|bible|search|p\/|editions|guide)/,
    icon: <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15ZM4 20.5A2.5 2.5 0 0 0 6.5 23H20M12 7v6M9.5 9.5h5" />,
  },
  {
    key: "flashcards",
    href: "/flashcards",
    match: /^\/(flashcards|daily)/,
    icon: <path d="M7 4h11a2 2 0 0 1 2 2v12M4 8a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8ZM8 12h5M8 16h3" />,
  },
  {
    key: "guidance",
    href: "/guidance",
    match: /^\/guidance/,
    icon: <path d="M12 3c4.97 0 9 3.58 9 8s-4.03 8-9 8c-1.1 0-2.15-.17-3.12-.49L4 20l1.3-3.9C3.86 14.7 3 12.93 3 11c0-4.42 4.03-8 9-8ZM12 8v6M9 11h6" />,
  },
  {
    key: "plans",
    href: "/plans",
    match: /^\/plans/,
    icon: <path d="M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM8.5 14l2.2 2.2L15.5 11.5" />,
  },
  {
    key: "watch",
    href: "/watch",
    match: /^\/watch/,
    icon: <path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1ZM10 9.5v5l4.5-2.5L10 9.5ZM8 21h8" />,
  },
  {
    key: "library",
    href: "/library",
    match: /^\/library/,
    icon: <path d="M7 3h10a1 1 0 0 1 1 1v17l-6-4-6 4V4a1 1 0 0 1 1-1Z" />,
  },
  {
    key: "journal",
    href: "/journal",
    match: /^\/journal/,
    icon: <path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6V3ZM6 3v18M10 8h5M10 12h5M3.5 7H6M3.5 12H6M3.5 17H6" />,
  },
  {
    key: "discover",
    href: "/discover",
    match: /^\/discover/,
    icon: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM15.5 8.5l-2 5-5 2 2-5 5-2Z" />,
  },
];

/**
 * Fixed bottom navigation. Every main section is one tap away (no "More"
 * menu). On phones the bar scrolls sideways with snap points; on wider
 * screens it becomes a centered floating bar. Respects the safe area.
 */
export function BottomNav({ t }: { t: Dictionary["tabs"] }) {
  const pathname = usePathname() ?? "/";
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    // Scroll the bar itself (not scrollIntoView, which would also move the
    // browser's keyboard focus starting point past the skip link).
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !active || list.scrollWidth <= list.clientWidth) return;
    const l = list.getBoundingClientRect();
    const a = active.getBoundingClientRect();
    list.scrollLeft += a.left + a.width / 2 - (l.left + l.width / 2);
  }, [pathname]);

  return (
    <nav
      aria-label={t.primary}
      className="bottom-nav no-print fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-surface/85 lg:inset-x-auto lg:bottom-4 lg:left-1/2 lg:-translate-x-1/2 lg:rounded-full lg:border lg:pb-0 lg:shadow-[0_8px_30px_rgb(0_0_0/0.10)]"
    >
      <ul ref={listRef} className="no-scrollbar flex h-[var(--nav-h)] snap-x snap-mandatory items-stretch overflow-x-auto px-1 lg:overflow-visible lg:px-2">
        {ITEMS.map((item) => {
          const active = item.match.test(pathname);
          return (
            <li key={item.key} className="shrink-0 snap-center">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group flex h-full min-w-[76px] flex-col items-center justify-center gap-1 px-2 text-[11px] font-semibold leading-none lg:min-w-[84px] ${
                  active ? "text-gold" : "text-muted hover:text-ink"
                }`}
              >
                <span
                  className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${
                    active ? "bg-gold-soft" : "group-hover:bg-gold-soft/50"
                  }`}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {item.icon}
                  </svg>
                </span>
                <span>{t[item.key]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
