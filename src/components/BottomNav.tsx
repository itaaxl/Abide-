"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type Key = "bible" | "flashcards" | "guidance" | "plans" | "library";

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
    key: "library",
    href: "/library",
    // Journal, Discover and Watch are reached from the Library.
    match: /^\/(library|journal|discover|watch)/,
    icon: <path d="M7 3h10a1 1 0 0 1 1 1v17l-6-4-6 4V4a1 1 0 0 1 1-1Z" />,
  },
];

const LAST_CHAPTER = "abide:last-chapter";
const CHAPTER_PATH = /^\/bible\/[a-z]{3}-[a-z0-9-]+\/[1-3A-Z]{3}\/\d+$/;

/**
 * Fixed bottom navigation with five sections that always fit on a phone.
 * Respects the bottom safe area; pages reserve its height (see globals.css)
 * so content is never hidden behind it. The pressed tab highlights at once,
 * before the next page arrives.
 */
export function BottomNav({ t }: { t: Dictionary["tabs"] }) {
  const pathname = usePathname() ?? "/";
  const [bibleHref, setBibleHref] = useState("/bible");

  // Remember the last chapter read so the Bible tab opens it directly
  // (no extra server redirect through /bible).
  useEffect(() => {
    try {
      if (CHAPTER_PATH.test(pathname)) localStorage.setItem(LAST_CHAPTER, pathname);
      const last = localStorage.getItem(LAST_CHAPTER);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser-only storage after hydration
      if (last && CHAPTER_PATH.test(last)) setBibleHref(last);
    } catch {
      /* storage unavailable: keep /bible */
    }
  }, [pathname]);

  return (
    <nav
      aria-label={t.primary}
      className="bottom-nav no-print fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-surface/85 lg:inset-x-auto lg:bottom-4 lg:left-1/2 lg:w-[30rem] lg:-translate-x-1/2 lg:rounded-full lg:border lg:pb-0 lg:shadow-[0_8px_30px_rgb(0_0_0/0.10)]"
    >
      <ul className="mx-auto grid h-[var(--nav-h)] max-w-lg grid-cols-5 items-stretch">
        {ITEMS.map((item) => {
          const active = item.match.test(pathname);
          return (
            <li key={item.key} className="min-w-0">
              <Link
                href={item.key === "bible" ? bibleHref : item.href}
                aria-current={active ? "page" : undefined}
                className={`tab-link group flex h-full flex-col items-center justify-center gap-0.5 px-0.5 text-[10.5px] font-semibold leading-tight ${
                  active ? "text-gold" : "text-muted hover:text-ink"
                }`}
              >
                <TabIcon active={active}>{item.icon}</TabIcon>
                <span className="max-w-full truncate">{t[item.key]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Icon pill; also shows the pending state while the tapped page loads. */
function TabIcon({ active, children }: { active: boolean; children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return (
    <span
      className={`tab-pill relative flex h-7 w-12 items-center justify-center rounded-full ${
        active || pending ? "bg-gold-soft text-gold" : "group-hover:bg-gold-soft/50"
      }`}
      data-pending={pending || undefined}
    >
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active || pending ? 2.1 : 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </span>
  );
}
