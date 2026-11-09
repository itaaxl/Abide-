"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { addPassageCard } from "@/app/actions/flashcards";
import { copyText } from "@/lib/clipboard";
import { LogoMark } from "../Logo";

export interface CarouselCard {
  id: string;
  /** Small label above the verse, e.g. "Today" or a date. */
  tag?: string;
  text: string;
  reference: string;
  editionId?: string;
  editionAbbr?: string;
  direction: "ltr" | "rtl";
  language?: string;
  reflection?: string;
  /** User-written (non-Scripture) card. */
  custom?: boolean;
  answer?: string;
  chapterHref?: string;
  shareKey?: string;
  passage?: { book: string; chapter: number; verseStart: number; verseEnd: number };
  note?: string;
}

interface Labels {
  reflection: string;
  save: string;
  saved: string;
  share: string;
  readChapter: string;
  previous: string;
  next: string;
  signInToSave: string;
  linkCopied: string;
  copyFailed: string;
  of: string;
  yourCard: string;
}

function verseSize(text: string) {
  if (text.length < 110) return "text-[1.7rem] leading-[1.35] sm:text-[2rem]";
  if (text.length < 220) return "text-[1.4rem] leading-[1.45] sm:text-[1.65rem]";
  if (text.length < 420) return "text-[1.18rem] leading-[1.55] sm:text-[1.35rem]";
  return "text-[1.05rem] leading-[1.6]";
}

export function VerseCarousel({
  cards,
  labels,
  canSave,
  showSave = true,
  ariaLabel,
}: {
  cards: CarouselCard[];
  labels: Labels;
  canSave: boolean;
  showSave?: boolean;
  ariaLabel: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const goTo = useCallback((i: number) => {
    const el = track.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(cards.length - 1, i));
    const slide = el.children[clamped] as HTMLElement | undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: slide ? slide.offsetLeft - el.offsetLeft : 0, behavior: reduce ? "auto" : "smooth" });
  }, [cards.length]);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.clientWidth || 1;
      setIndex(Math.round(el.scrollLeft / w));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section aria-roledescription="carousel" aria-label={ariaLabel} className="relative">
      <div
        ref={track}
        dir="ltr"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            goTo(index + 1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            goTo(index - 1);
          }
        }}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-[28px] outline-offset-4"
      >
        {cards.map((c, i) => (
          <div
            key={c.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} ${labels.of} ${cards.length}: ${c.reference}`}
            aria-hidden={i !== index}
            inert={i !== index}
            className="w-full shrink-0 snap-center px-0.5"
          >
            <VerseCard card={c} labels={labels} canSave={canSave} showSave={showSave} />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button type="button" className="btn h-11 w-11 p-0" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label={labels.previous}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="rtl:rotate-180">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {cards.length <= 15 ? (
            cards.map((c, i) => (
              <span key={c.id} className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-gold" : "w-1.5 bg-rule"}`} />
            ))
          ) : (
            <span className="text-sm text-muted">{index + 1} / {cards.length}</span>
          )}
        </div>
        <p className="sr-only" aria-live="polite">
          {index + 1} {labels.of} {cards.length}
        </p>
        <button type="button" className="btn h-11 w-11 p-0" onClick={() => goTo(index + 1)} disabled={index >= cards.length - 1} aria-label={labels.next}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="rtl:rotate-180">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </section>
  );
}

function VerseCard({ card, labels, canSave, showSave }: { card: CarouselCard; labels: Labels; canSave: boolean; showSave: boolean }) {
  const [status, setStatus] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  function save() {
    if (!card.passage || !card.editionId) return;
    start(async () => {
      const r = await addPassageCard({ edition: card.editionId!, ...card.passage! });
      if (r.ok || /already in that deck/.test(r.error ?? "")) {
        setSaved(true);
        setStatus(labels.saved);
      } else setStatus(r.error);
    });
  }

  async function share() {
    if (!card.shareKey || !card.editionId) return;
    const url = `${location.origin}/p/${card.editionId}/${card.shareKey}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: card.reference, url });
        return;
      } catch {
        /* cancelled: fall back to copying */
      }
    }
    setStatus((await copyText(url)) ? labels.linkCopied : labels.copyFailed);
  }

  return (
    <article
      className="relative flex min-h-[min(64vh,560px)] flex-col overflow-hidden rounded-[28px] border border-rule p-6 shadow-[var(--shadow-card)] sm:p-9"
      style={{ background: "var(--card-glow)" }}
    >
      <LogoMark className="pointer-events-none absolute -end-6 -bottom-6 h-32 w-32 opacity-[0.035]" />
      <div className="flex items-center justify-between gap-3 text-xs">
        {card.tag ? <span className="rounded-full bg-gold-soft px-3 py-1 font-semibold text-gold">{card.tag}</span> : <span />}
        {card.custom ? (
          <span className="text-muted">{labels.yourCard}</span>
        ) : (
          card.editionAbbr && <span className="font-semibold tracking-wider text-muted" title="Translation">{card.editionAbbr}</span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center py-7">
        <blockquote
          dir={card.custom ? "auto" : card.direction}
          lang={card.custom ? undefined : card.language}
          className={`${card.custom ? "font-sans text-xl font-medium leading-relaxed" : `font-serif ${verseSize(card.text)}`} text-ink`}
        >
          {card.text}
        </blockquote>
        {card.answer && <p className="mt-4 text-base text-muted" dir="auto">{card.answer}</p>}
        <p className="mt-5 text-[0.95rem] font-semibold text-gold" dir={card.direction}>
          <Reference text={card.reference} />
        </p>
        {card.note && <p className="mt-1 text-xs text-muted">{card.note}</p>}
      </div>

      {card.reflection && (
        <div className="rounded-2xl bg-surface/70 px-4 py-3 ring-1 ring-rule">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">{labels.reflection}</p>
          <p className="mt-0.5 text-[0.95rem] leading-snug text-ink/85">{card.reflection}</p>
        </div>
      )}

      {!card.custom && (
        <div className="mt-4 flex flex-wrap items-center gap-1">
          {showSave &&
            (canSave ? (
              <button type="button" className="btn btn-sm btn-ghost" onClick={save} disabled={pending || saved} aria-busy={pending} aria-pressed={saved}>
                <Icon d={saved ? "M7 3h10a1 1 0 0 1 1 1v17l-6-4-6 4V4a1 1 0 0 1 1-1Z" : "M7 3h10a1 1 0 0 1 1 1v17l-6-4-6 4V4a1 1 0 0 1 1-1Z"} filled={saved} />
                {saved ? labels.saved : labels.save}
              </button>
            ) : (
              <Link href="/auth/sign-in?next=/flashcards" className="btn btn-sm btn-ghost">
                <Icon d="M7 3h10a1 1 0 0 1 1 1v17l-6-4-6 4V4a1 1 0 0 1 1-1Z" />
                {labels.save}
              </Link>
            ))}
          {card.shareKey && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={share}>
              <Icon d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
              {labels.share}
            </button>
          )}
          {card.chapterHref && (
            <Link href={card.chapterHref} className="btn btn-sm btn-ghost">
              <Icon d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15ZM4 20.5A2.5 2.5 0 0 0 6.5 23H20" />
              {labels.readChapter}
            </Link>
          )}
        </div>
      )}
      <p role="status" aria-live="polite" className="min-h-5 pt-1 text-sm text-success">
        {status}
      </p>
    </article>
  );
}

function Icon({ d, filled = false }: { d: string; filled?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/** Keeps "37:4–5" in reading order inside right-to-left text. */
function Reference({ text }: { text: string }) {
  const m = /^(.*\S)\s+([\d:.,–-]+)$/.exec(text);
  if (!m) return <>{text}</>;
  return (
    <>
      {m[1]} <bdi dir="ltr">{m[2]}</bdi>
    </>
  );
}
