"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleBookmark } from "@/app/actions/annotations";
import { addPassageCard } from "@/app/actions/flashcards";
import { copyText } from "@/lib/clipboard";
import { useMsg, useT } from "./LocaleProvider";

export interface PassageActionProps {
  edition: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  label: string;
  text: string;
  attribution: string;
  abbreviation: string;
  chapterHref: string;
  shareKey: string;
  canSave: boolean;
  compact?: boolean;
}

export function PassageActions(p: PassageActionProps) {
  const T = useT();
  const tr = useMsg();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const flash = (m: string) => {
    setMsg(tr(m));
    setTimeout(() => setMsg(null), 3000);
  };
  const passage = { edition: p.edition, book: p.book, chapter: p.chapter, verseStart: p.verseStart, verseEnd: p.verseEnd };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Link href={p.chapterHref} className="btn btn-sm">
          {T("Read the chapter", "Lire le chapitre", "اقرأ الأصحاح")}
        </Link>
        <button
          className="btn btn-sm"
          onClick={async () => flash((await copyText(`${p.text}\n— ${p.label} (${p.abbreviation})\n${p.attribution}`)) ? T("Copied", "Copié", "نُسخ") : T("Copy failed — select the text to copy it.", "Échec de la copie — sélectionnez le texte.", "فشل النسخ — حدّد النص لنسخه."))}
        >
          {T("Copy", "Copier", "نسخ")}
        </button>
        <button
          className="btn btn-sm"
          onClick={async () => flash((await copyText(`${location.origin}/p/${p.edition}/${p.shareKey}`)) ? T("Link copied", "Lien copié", "نُسخ الرابط") : T("Copy failed", "Échec de la copie", "فشل النسخ"))}
        >
          {T("Share link", "Partager le lien", "شارك الرابط")}
        </button>
        {p.canSave ? (
          <>
            <button
              className="btn btn-sm"
              disabled={pending} aria-busy={pending}
              onClick={() =>
                start(async () => {
                  const r = await toggleBookmark(passage);
                  flash(r.ok ? (r.data ? T("Bookmarked", "Ajouté aux signets", "أُضيفت إشارة") : T("Bookmark removed", "Signet retiré", "أُزيلت الإشارة")) : r.error);
                })
              }
            >
              ☆ {T("Bookmark", "Signet", "إشارة")}
            </button>
            <button
              className="btn btn-sm"
              disabled={pending} aria-busy={pending}
              onClick={() =>
                start(async () => {
                  const r = await addPassageCard(passage);
                  flash(r.ok ? T("Added to your flashcards", "Ajouté à vos cartes", "أُضيف إلى بطاقاتك") : r.error);
                })
              }
            >
              {T("Make flashcard", "Créer une carte", "أنشئ بطاقة")}
            </button>
          </>
        ) : (
          !p.compact && (
            <Link href="/auth/sign-in" className="self-center text-sm text-muted underline">
              {T("Sign in to bookmark or make a flashcard", "Connectez-vous pour enregistrer ou créer une carte", "سجّل الدخول لحفظ إشارة أو إنشاء بطاقة")}
            </Link>
          )
        )}
      </div>
      <p role="status" aria-live="polite" className="mt-1 min-h-5 text-sm text-success">
        {msg}
      </p>
    </div>
  );
}
