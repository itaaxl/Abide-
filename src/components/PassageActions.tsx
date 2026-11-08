"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleBookmark } from "@/app/actions/annotations";
import { addPassageCard } from "@/app/actions/flashcards";
import { copyText } from "@/lib/clipboard";

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
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 3000);
  };
  const passage = { edition: p.edition, book: p.book, chapter: p.chapter, verseStart: p.verseStart, verseEnd: p.verseEnd };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Link href={p.chapterHref} className="btn btn-sm">
          Read the chapter
        </Link>
        <button
          className="btn btn-sm"
          onClick={async () => flash((await copyText(`${p.text}\n— ${p.label} (${p.abbreviation})\n${p.attribution}`)) ? "Copied" : "Copy failed — select the text to copy it.")}
        >
          Copy
        </button>
        <button
          className="btn btn-sm"
          onClick={async () => flash((await copyText(`${location.origin}/p/${p.edition}/${p.shareKey}`)) ? "Link copied" : "Copy failed")}
        >
          Share link
        </button>
        {p.canSave ? (
          <>
            <button
              className="btn btn-sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await toggleBookmark(passage);
                  flash(r.ok ? (r.data ? "Bookmarked" : "Bookmark removed") : r.error);
                })
              }
            >
              ☆ Bookmark
            </button>
            <button
              className="btn btn-sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await addPassageCard(passage);
                  flash(r.ok ? "Added to your flashcards" : r.error);
                })
              }
            >
              Make flashcard
            </button>
          </>
        ) : (
          !p.compact && (
            <Link href="/auth/sign-in" className="self-center text-sm text-muted underline">
              Sign in to bookmark or make a flashcard
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
