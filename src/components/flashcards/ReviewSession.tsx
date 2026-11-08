"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { reviewCard } from "@/app/actions/flashcards";
import type { CardFace } from "@/lib/flashcards";
import { RATINGS, schedule, describeInterval, type Rating } from "@/lib/srs";

const LABELS: Record<Rating, string> = { again: "Again", hard: "Hard", good: "Good", easy: "Easy" };

export function ReviewSession({ cards, practice, timezone, target, reviewedToday }: { cards: CardFace[]; practice: boolean; timezone: string; target: number; reviewedToday: number }) {
  const [queue, setQueue] = useState(cards);
  const [flipped, setFlipped] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(0);
  // One idempotency key per answer attempt for the current card.
  const requestId = useRef<string>(crypto.randomUUID());
  const card = queue[0];

  const advance = useCallback(() => {
    requestId.current = crypto.randomUUID();
    setFlipped(false);
  }, []);

  const rate = useCallback(
    async (rating: Rating) => {
      if (!card || pending || !flipped) return;
      if (practice) {
        setQueue((q) => q.slice(1));
        setDone((d) => d + 1);
        advance();
        return;
      }
      setPending(true);
      setError(null);
      const res = await reviewCard({ cardId: card.id, requestId: requestId.current, rating, expectedVersion: card.version });
      setPending(false);
      if (!res.ok) {
        // Keep the card: move it to the end so it can be retried.
        setError(res.error);
        return;
      }
      if (res.data?.status === "conflict") {
        setError("This card was reviewed on another device. It has been updated; moving on.");
      }
      const relearn = rating === "again";
      setQueue((q) => {
        const [first, ...rest] = q;
        return relearn ? [...rest, { ...first, version: (res.data?.version ?? first.version) }] : rest;
      });
      setDone((d) => d + 1);
      advance();
    },
    [card, pending, flipped, practice, advance],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (e.key === " " || e.key === "Enter") {
        if (!flipped) {
          e.preventDefault();
          setFlipped(true);
        }
      } else if (flipped && ["1", "2", "3", "4"].includes(e.key)) {
        void rate(RATINGS[Number(e.key) - 1]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, rate]);

  if (!card)
    return (
      <div className="card p-8 text-center">
        <p className="font-serif text-2xl">{practice ? "Practice complete." : "You’re all caught up for today."}</p>
        <p className="mt-2 text-muted">
          {done} card{done === 1 ? "" : "s"} {practice ? "practised" : "reviewed"} this session. Rest is part of learning — the next cards will be ready when they’re due.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Link href="/flashcards" className="btn">Back to decks</Link>
          {!practice && <Link href="/flashcards/review?mode=practice" className="btn">Practise anyway</Link>}
        </div>
      </div>
    );

  const now = new Date();
  const preview = (r: Rating) => describeInterval(schedule(card.state, r, now, timezone), now);
  const totalToday = reviewedToday + done;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm text-muted">
        <span>{queue.length} left{practice ? " · practice (schedule unchanged)" : ""}</span>
        {!practice && <span>Today: {totalToday} / {target} goal</span>}
      </div>
      <div className="flip-card">
        <div
          className={`flip-inner ${flipped ? "flipped" : ""}`}
          // Mouse/touch convenience only; keyboard and screen readers use the "Show answer" button.
          onClick={() => setFlipped(true)}
        >
          <div className="flip-face flip-front card min-h-72 p-8" inert={flipped}>
            <Face card={card} side="front" />
          </div>
          <div className="flip-face flip-back card min-h-72 p-8" inert={!flipped}>
            <Face card={card} side="back" />
          </div>
        </div>
      </div>
      {!flipped ? (
        <button className="btn btn-primary mt-4 w-full" onClick={() => setFlipped(true)}>
          Show answer <span className="text-xs opacity-70">(Space)</span>
        </button>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="How well did you remember?">
          {RATINGS.map((r, i) => (
            <button key={r} className="btn flex-col py-2" disabled={pending} onClick={() => rate(r)}>
              <span>{LABELS[r]}</span>
              <span className="text-xs text-muted">{practice ? `key ${i + 1}` : `${preview(r)} · ${i + 1}`}</span>
            </button>
          ))}
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}

function Face({ card, side }: { card: CardFace; side: "front" | "back" }) {
  const label = card.scripture ? `${card.editionAbbr} · ${kindLabel(card.kind)}` : "Your own card — not Scripture";
  return (
    <div className="flex h-full flex-col">
      <p className={`text-xs uppercase tracking-wider ${card.scripture ? "text-gold" : "text-muted"}`}>{label}</p>
      <div className="flex flex-1 items-center justify-center py-6 text-center">
        {card.kind === "cloze" && card.cloze ? (
          <p className="font-serif text-2xl leading-relaxed" dir={card.direction}>
            {card.cloze.words.map((w, i) =>
              card.cloze!.hidden.includes(i) ? (
                side === "front" ? (
                  <span key={i} className="mx-0.5 inline-block min-w-12 border-b-2 border-gold" aria-label="missing word">
                    &nbsp;
                  </span>
                ) : (
                  <mark key={i} className="search-hit">{w} </mark>
                )
              ) : (
                <span key={i}>{w} </span>
              ),
            )}
          </p>
        ) : (
          <p className={`${card.scripture ? "font-serif" : ""} whitespace-pre-wrap text-2xl leading-relaxed`} dir={card.direction}>
            {side === "front" ? card.front : card.back}
          </p>
        )}
      </div>
      {side === "back" && card.reference && (
        <p className="text-sm text-muted">
          {card.kind !== "text_to_ref" && <>{card.reference} · </>}
          <Link href={card.href!} className="underline" onClick={(e) => e.stopPropagation()}>
            Open in Bible
          </Link>
        </p>
      )}
    </div>
  );
}

function kindLabel(k: CardFace["kind"]) {
  return k === "ref_to_text" ? "Reference → verse" : k === "text_to_ref" ? "Verse → reference" : k === "cloze" ? "Missing words" : "Custom";
}
