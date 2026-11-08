import Link from "next/link";
import { site } from "@/config/site";
import { getSessionUser } from "@/lib/auth";
import { getDictionary } from "@/lib/request";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LogoMark } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { signOutAction } from "@/app/auth/actions";

export async function SiteHeader() {
  const { t } = await getDictionary();
  const user = await getSessionUser();
  const authAvailable = isSupabaseConfigured();
  const links = [
    { href: "/bible", label: t.nav.bible },
    { href: "/daily", label: t.nav.daily },
    { href: "/flashcards", label: t.nav.flashcards },
    { href: "/plans", label: t.nav.plans },
    { href: "/guidance", label: t.nav.guidance },
    { href: "/watch", label: t.nav.watch },
    { href: "/library", label: t.nav.library },
  ];

  return (
    <header className="no-print sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
      <a href="#main" className="sr-only-focusable btn btn-sm absolute start-2 top-2 z-50">
        {t.nav.skip}
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 text-ink" aria-label={`${site.name} home`}>
          <LogoMark />
          <span className="font-serif text-2xl tracking-wide">{site.name}</span>
        </Link>
        <nav aria-label="Main" className="ms-4 hidden lg:block">
          <ul className="flex items-center gap-1 text-[0.92rem]">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="rounded-full px-3 py-2 text-ink/85 hover:bg-gold-soft/40 hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ms-auto hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              {user.isAdmin && (
                <Link href="/admin" className="btn btn-sm btn-ghost">
                  {t.nav.admin}
                </Link>
              )}
              <Link href="/account" className="btn btn-sm btn-ghost">
                {t.nav.settings}
              </Link>
              <form action={signOutAction}>
                <button className="btn btn-sm">{t.nav.signOut}</button>
              </form>
            </>
          ) : authAvailable ? (
            <>
              <Link href="/auth/sign-in" className="btn btn-sm btn-ghost">
                {t.nav.signIn}
              </Link>
              <Link href="/auth/sign-up" className="btn btn-sm btn-primary">
                {t.nav.signUp}
              </Link>
            </>
          ) : null}
        </div>
        <MobileMenu
          links={[...links, { href: "/journal", label: t.nav.journal }, { href: "/discover", label: t.nav.discover }]}
          labels={{ menu: t.nav.menu, close: t.nav.close, signIn: t.nav.signIn, signUp: t.nav.signUp, settings: t.nav.settings, signOut: t.nav.signOut }}
          signedIn={Boolean(user)}
          authAvailable={authAvailable}
        />
      </div>
    </header>
  );
}
