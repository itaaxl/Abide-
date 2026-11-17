"use client";

import Link from "next/link";
import { useT } from "@/components/LocaleProvider";

/** Generic error boundary. Never displays error details that could include personal data. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const T = useT();
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold tracking-tight">{T("Something went wrong", "Un problème est survenu", "حدث خطأ")}</h1>
      <p className="mt-3 text-muted">
        {T(
          "This may be a temporary network problem. Your saved data is safe.",
          "Il s’agit peut-être d’un problème réseau temporaire. Vos données sont en sécurité.",
          "قد تكون مشكلة مؤقتة في الشبكة. بياناتك المحفوظة آمنة.",
        )}
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <button className="btn btn-primary" onClick={reset}>
          {T("Try again", "Réessayer", "حاول مجددًا")}
        </button>
        <Link className="btn" href="/">
          {T("Home", "Accueil", "الرئيسية")}
        </Link>
      </div>
    </div>
  );
}
