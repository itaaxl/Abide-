"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/app/auth/actions";

interface Props {
  links: { href: string; label: string }[];
  labels: { menu: string; close: string; signIn: string; signUp: string; settings: string; signOut: string };
  signedIn: boolean;
  authAvailable: boolean;
}

export function MobileMenu({ links, labels, signedIn, authAvailable }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="ms-auto lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        className="btn btn-sm"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
        {open ? labels.close : labels.menu}
      </button>
      {open && (
        <div
          id="mobile-menu"
          ref={panelRef}
          className="absolute inset-x-0 top-16 border-b border-rule bg-paper px-4 pb-6 pt-2 shadow-lg"
        >
          <nav aria-label="Mobile">
            <ul className="grid grid-cols-2 gap-1">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="block rounded-lg px-3 py-3 hover:bg-gold-soft/40">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-4 flex gap-2 border-t border-rule pt-4">
            {signedIn ? (
              <>
                <Link href="/account" className="btn btn-sm flex-1">
                  {labels.settings}
                </Link>
                <form action={signOutAction} className="flex-1">
                  <button className="btn btn-sm w-full">{labels.signOut}</button>
                </form>
              </>
            ) : authAvailable ? (
              <>
                <Link href="/auth/sign-in" className="btn btn-sm flex-1">
                  {labels.signIn}
                </Link>
                <Link href="/auth/sign-up" className="btn btn-sm btn-primary flex-1">
                  {labels.signUp}
                </Link>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
