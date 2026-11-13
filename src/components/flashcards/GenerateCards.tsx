"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { generateCards, type GenerateCardsResult } from "@/app/actions/cards-ai";
import { VerseCarousel, type CarouselCard } from "./VerseCarousel";

type Mode = "topic" | "chapter" | "goal";

interface Props {
  edition: string;
  topics: { slug: string; label: string }[];
  books: { id: string; name: string; chapters: number }[];
  /** Signed in with a verified email. */
  canUse: boolean;
  /** AI is configured on this deployment. */
  available: boolean;
  labels: React.ComponentProps<typeof VerseCarousel>["labels"];
}

/**
 * "Generate cards": pick a topic, a chapter, or a personal goal; AI picks 3–5
 * passages from the verified Bible text and adds a short reflection. Cards are
 * shown first; only the ones the person saves are kept.
 */
export function GenerateCards({ edition, topics, books, canUse, available, labels }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("topic");
  const [topic, setTopic] = useState(topics[0]?.slug ?? "");
  const [book, setBook] = useState(books.find((b) => b.id === "PSA")?.id ?? books[0]?.id ?? "");
  const [chapter, setChapter] = useState(23);
  const [goal, setGoal] = useState("");
  const [result, setResult] = useState<GenerateCardsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const chapters = books.find((b) => b.id === book)?.chapters ?? 1;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    start(async () => {
      const input = mode === "topic" ? { mode, topic } : mode === "chapter" ? { mode, book, chapter: Math.min(chapter, chapters) } : { mode, text: goal };
      const r = await generateCards({ ...input, edition } as Parameters<typeof generateCards>[0]);
      if (!r.ok) {
        setError(r.error ?? "Something went wrong. Please try again.");
        setResult(null);
      } else setResult(r.data!);
    });
  }

  if (!open)
    return (
      <button type="button" className="btn btn-sm mb-4" onClick={() => setOpen(true)}>
        <span aria-hidden="true" className="text-[var(--warm)]">✦</span> Generate cards
      </button>
    );

  const cards: CarouselCard[] =
    result?.kind === "cards"
      ? result.cards.map((g) => ({ ...g, tag: "Generated" }))
      : [];

  return (
    <section aria-labelledby="gen-title" className="mb-6 rounded-[24px] border border-rule bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="gen-title" className="text-base font-semibold">Generate cards</h2>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>

      {!available ? (
        <p className="mt-2 text-sm text-muted">AI card generation isn’t available on this site yet. The verse cards below are curated by people.</p>
      ) : !canUse ? (
        <p className="mt-2 text-sm text-muted">
          <Link className="underline" href="/auth/sign-in?next=/flashcards">Sign in</Link> to generate cards.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-3 space-y-3">
          <div role="radiogroup" aria-label="Generate from" className="flex rounded-full border border-rule p-1 text-sm">
            {(["topic", "chapter", "goal"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-full px-3 py-1.5 font-semibold ${mode === m ? "bg-gold text-[var(--on-accent)]" : "text-muted"}`}
              >
                {m === "topic" ? "Topic" : m === "chapter" ? "Chapter" : "Goal"}
              </button>
            ))}
          </div>

          {mode === "topic" && (
            <div>
              <label htmlFor="gen-topic" className="label">Topic</label>
              <select id="gen-topic" className="input" value={topic} onChange={(e) => setTopic(e.target.value)}>
                {topics.map((t) => (
                  <option key={t.slug} value={t.slug}>{t.label}</option>
                ))}
              </select>
            </div>
          )}
          {mode === "chapter" && (
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <label htmlFor="gen-book" className="label">Book</label>
                <select id="gen-book" className="input" value={book} onChange={(e) => { setBook(e.target.value); setChapter(1); }}>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-24 shrink-0">
                <label htmlFor="gen-ch" className="label">Chapter</label>
                <select id="gen-ch" className="input" value={Math.min(chapter, chapters)} onChange={(e) => setChapter(Number(e.target.value))}>
                  {Array.from({ length: chapters }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {mode === "goal" && (
            <div>
              <label htmlFor="gen-goal" className="label">Your goal</label>
              <input id="gen-goal" className="input" maxLength={300} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Be more patient with my children" />
              <p className="mt-1 text-xs text-muted">Only these words are sent to our AI provider. Your notes and journal are never sent.</p>
            </div>
          )}

          <button className="btn btn-primary w-full" disabled={pending || (mode === "goal" && goal.trim().length < 3)} aria-busy={pending}>
            {pending ? "Choosing passages…" : "Generate 3–5 cards"}
          </button>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        </form>
      )}

      <div aria-live="polite">
        {result?.kind === "clarify" && (
          <p role="status" className="mt-4 rounded-2xl border border-rule p-4 text-sm">{result.question}</p>
        )}
        {result?.kind === "support" && (
          <p role="status" className="mt-4 rounded-2xl border border-danger/40 p-4 text-sm">
            It sounds like you may be going through something very hard. Please reach out to someone you trust or a local helpline —{" "}
            <a className="underline" href="https://findahelpline.com/" target="_blank" rel="noopener noreferrer">findahelpline.com</a>.
          </p>
        )}
        {result?.kind === "cards" && (
          <div className="mt-4">
            <p className="mb-3 text-xs text-muted">
              Not saved yet — tap <strong>Save</strong> on the cards you want to keep. Verse text comes from the Bible edition; the reflection is AI-written and may be imperfect.
              {result.cached ? " (Reused from an earlier request.)" : result.remainingToday !== undefined ? ` ${result.remainingToday} AI requests left today.` : ""}
            </p>
            <VerseCarousel cards={cards} labels={{ ...labels, reflection: labels.aiReflection ?? "AI reflection" }} canSave={canUse} ariaLabel="Generated cards" />
          </div>
        )}
      </div>
    </section>
  );
}
