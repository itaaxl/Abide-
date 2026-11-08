"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { requestGuidance, saveGuidance } from "@/app/actions/guidance";
import type { GuidanceResult } from "@/lib/guidance/schema";
import { PassageActions } from "../PassageActions";

const TOPICS = [
  ["anxiety", "Anxiety"],
  ["grief", "Grief"],
  ["anger", "Anger"],
  ["forgiveness", "Forgiveness"],
  ["motivation", "Motivation"],
  ["gratitude", "Gratitude"],
  ["relationships", "Relationships"],
  ["closer-to-god", "Growing closer to God"],
  ["doubt", "Doubt"],
  ["hope", "Hope"],
] as const;

const FALLBACK_TEXT: Record<NonNullable<GuidanceResult["fallbackReason"]>, string> = {
  unconfigured: "AI suggestions aren’t available on this site right now.",
  quota: "You’ve reached today’s limit for AI suggestions.",
  "provider-error": "The AI service didn’t respond just now.",
  refusal: "The AI service declined this request.",
  malformed: "The AI response couldn’t be verified, so we didn’t show it.",
  "no-matches": "We couldn’t find closely matching passages.",
};

export function GuidanceForm({ edition, maxChars, canUse, signInHref }: { edition: string; maxChars: number; canUse: boolean; signInHref: string }) {
  const [text, setText] = useState("");
  const [topic, setTopic] = useState<string | undefined>();
  const [tone, setTone] = useState<string | undefined>();
  const [result, setResult] = useState<GuidanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(null);
    start(async () => {
      const r = await requestGuidance({ text, topic, tone, edition });
      if (!r.ok) setError(r.error);
      else setResult(r.data!);
    });
  }

  function save() {
    if (!result || result.kind === "crisis") return;
    const kind = result.kind;
    start(async () => {
      const r = await saveGuidance({
        text,
        topic,
        edition,
        result: {
          kind,
          opening: result.opening,
          passages: result.passages.map((p) => ({ key: p.key, label: p.label, connection: p.connection })),
          practicalSteps: result.practicalSteps,
          prayer: result.prayer,
        },
      });
      setSaved(r.ok ? "Saved privately to your library." : r.error);
    });
  }

  return (
    <div>
      <form onSubmit={submit} className="card space-y-4 p-6">
        <fieldset>
          <legend className="label">Choose a topic (optional)</legend>
          <div className="flex flex-wrap gap-1">
            {TOPICS.map(([slug, label]) => (
              <button type="button" key={slug} className={`btn btn-sm ${topic === slug ? "btn-primary" : ""}`} aria-pressed={topic === slug} onClick={() => setTopic(topic === slug ? undefined : slug)}>
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="gtext" className="label">What are you facing, hoping for, or trying to grow in?</label>
          <textarea
            id="gtext"
            className="input min-h-32"
            maxLength={maxChars}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="For example: I’m worried about my job and can’t sleep."
            required
            aria-describedby="gtext-help"
          />
          <p id="gtext-help" className="mt-1 text-xs text-muted">
            {text.length}/{maxChars}. You don’t need to share names or personal details. This text is sent to our AI provider to choose passages; it is not saved unless you press “Save”.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="gtone" className="label">Tone (optional)</label>
            <select id="gtone" className="input w-auto" value={tone ?? ""} onChange={(e) => setTone(e.target.value || undefined)}>
              <option value="">No preference</option>
              <option value="gentle">Gentle</option>
              <option value="encouraging">Encouraging</option>
              <option value="reflective">Reflective</option>
              <option value="practical">Practical</option>
            </select>
          </div>
          {canUse ? (
            <button className="btn btn-primary" disabled={pending || text.trim().length < 3}>
              {pending ? "Finding passages…" : "Find passages"}
            </button>
          ) : (
            <Link href={signInHref} className="btn btn-primary">Sign in to continue</Link>
          )}
        </div>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </form>

      <div aria-live="polite" className="mt-8">
        {result?.kind === "crisis" && (
          <section role="alert" className="card border-danger/50 p-6">
            {result.opening!.split("\n\n").map((p, i) => (
              <p key={i} className={i === 0 ? "font-serif text-2xl" : "mt-3 leading-relaxed"}>{p}</p>
            ))}
            <a href="https://findahelpline.com/" className="btn btn-primary mt-4" target="_blank" rel="noopener noreferrer">
              Find a helpline (findahelpline.com)
            </a>
          </section>
        )}

        {result && result.kind !== "crisis" && (
          <section className="space-y-6">
            {result.kind === "fallback" && (
              <p role="status" className="rounded-lg border border-rule bg-gold-soft/30 p-4 text-sm">
                {FALLBACK_TEXT[result.fallbackReason ?? "unconfigured"]} Below are passages <strong>selected from our curated topic list</strong> (chosen by people, not by AI) that match words in your request.
              </p>
            )}
            {result.opening && (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted">AI-generated reflection — not Scripture</p>
                <p className="mt-1 text-lg leading-relaxed">{result.opening}</p>
              </div>
            )}
            {result.passages.map((p) => (
              <article key={p.key} className="card p-6">
                <p className="eyebrow">{p.label} · {p.editionAbbr}</p>
                <blockquote className="mt-2 font-serif text-xl leading-relaxed" dir={p.direction}>{p.text}</blockquote>
                <div className="mt-4 rounded-lg bg-gold-soft/20 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted">
                    {result.kind === "ai" ? "Why this passage may help (AI-generated, may be imperfect)" : "Curated note"}
                  </p>
                  <p className="mt-1 leading-relaxed">{p.connection}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={p.href} className="btn btn-sm">Open in Bible</Link>
                </div>
                <div className="mt-2">
                  <PassageActions
                    edition={p.edition}
                    book={p.book}
                    chapter={p.chapter}
                    verseStart={p.verseStart}
                    verseEnd={p.verseEnd}
                    label={p.label}
                    text={p.text}
                    attribution=""
                    abbreviation={p.editionAbbr}
                    chapterHref={p.chapterHref}
                    shareKey={p.key}
                    canSave={canUse}
                    compact
                  />
                </div>
              </article>
            ))}
            {result.practicalSteps.length > 0 && (
              <div>
                <h2 className="font-serif text-xl">Small steps you might take</h2>
                <ul className="mt-2 list-disc space-y-1 ps-6">{result.practicalSteps.map((s) => <li key={s}>{s}</li>)}</ul>
              </div>
            )}
            {result.prayer && (
              <div>
                <h2 className="font-serif text-xl">A prayer you could use</h2>
                <p className="mt-2 italic leading-relaxed">{result.prayer}</p>
              </div>
            )}
            {result.suggestHumanSupport && (
              <p className="card p-4">Talking with someone you trust — a friend, pastor, or counselor — could also help with what you’re carrying.</p>
            )}
            <p className="text-sm text-muted">
              Reading the whole chapter helps you see each passage in context. Christians in different traditions may read some passages differently.
              {result.remainingToday !== undefined && ` · ${result.remainingToday} AI requests left today.`}
            </p>
            {canUse && (
              <div className="flex items-center gap-3">
                <button className="btn" onClick={save} disabled={pending}>Save this guidance (private)</button>
                {saved && <p role="status" className="text-sm text-success">{saved}</p>}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
