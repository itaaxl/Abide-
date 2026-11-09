import Link from "next/link";
import { site } from "@/config/site";
import { getSessionUser } from "@/lib/auth";
import { getDictionary } from "@/lib/request";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Wordmark } from "./Logo";

/** Compact app header: wordmark, search, and a small account control. Sections live in the bottom bar. */
export async function SiteHeader() {
  const { t } = await getDictionary();
  const user = await getSessionUser();
  const initial = (user?.displayName || user?.email || "?").trim().charAt(0).toUpperCase();
  return (
    <header className="no-print sticky top-0 z-40 border-b border-rule bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <a href="#main" className="sr-only-focusable btn btn-sm absolute start-2 top-2 z-50">
        {t.nav.skip}
      </a>
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
        <Link href="/" aria-label={`${site.name} home`} className="me-auto">
          <Wordmark />
        </Link>
        <Link href="/search" aria-label={t.tabs.search} className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-gold-soft/60 hover:text-ink">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </Link>
        {user ? (
          <>
            {user.isAdmin && (
              <Link href="/admin" className="btn btn-sm btn-ghost">
                {t.nav.admin}
              </Link>
            )}
            <Link
              href="/account"
              aria-label={`${t.tabs.account} (${user.email})`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-sm font-bold text-[var(--on-accent)]"
            >
              {initial}
            </Link>
          </>
        ) : isSupabaseConfigured() ? (
          <Link href="/auth/sign-in" className="btn btn-sm">
            {t.nav.signIn}
          </Link>
        ) : null}
      </div>
    </header>
  );
}
