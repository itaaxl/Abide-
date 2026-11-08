import Link from "next/link";
import { site } from "@/config/site";
import { getDictionary } from "@/lib/request";
import { LocaleSwitcher } from "./LocaleSwitcher";

export async function SiteFooter() {
  const { t, locale } = await getDictionary();
  const links = [
    { href: "/about", label: t.footer.about },
    { href: "/help", label: t.footer.help },
    { href: "/guide", label: t.footer.guide },
    { href: "/editions", label: t.footer.editions },
    { href: "/credits", label: t.footer.credits },
    { href: "/privacy", label: t.footer.privacy },
    { href: "/terms", label: t.footer.terms },
  ];
  return (
    <footer className="no-print mt-16 border-t border-rule">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-muted md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-2">
          <p className="font-serif text-lg text-ink">{site.name}</p>
          <p>{t.footer.note}</p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-ink hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <LocaleSwitcher current={locale} />
      </div>
    </footer>
  );
}
