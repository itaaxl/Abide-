import Link from "next/link";
import { getT } from "@/lib/request";

export default async function NotFound() {
  const { T } = await getT();
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="eyebrow">{T("Not found", "Introuvable", "غير موجود")}</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">{T("We couldn’t find that page", "Page introuvable", "لم نجد هذه الصفحة")}</h1>
      <p className="mt-3 text-muted">
        {T(
          "The book, chapter, or page may not exist in this translation. Try searching, or browse the books.",
          "Le livre, le chapitre ou la page n’existe peut-être pas dans cette traduction. Essayez la recherche ou parcourez les livres.",
          "قد لا يوجد السفر أو الأصحاح أو الصفحة في هذه الترجمة. جرّب البحث أو تصفّح الأسفار.",
        )}
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Link className="btn btn-primary" href="/bible">
          {T("Open the Bible", "Ouvrir la Bible", "افتح الكتاب المقدس")}
        </Link>
        <Link className="btn" href="/search">
          {T("Search", "Chercher", "بحث")}
        </Link>
      </div>
    </div>
  );
}
