"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { generateCards, type GenerateCardsResult } from "@/app/actions/cards-ai";
import { useLocale, useMsg, useT } from "../LocaleProvider";
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
  const T = useT();
  const msg = useMsg();
  const locale = useLocale();
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
      const r = await generateCards({ ...input, edition, locale } as Parameters<typeof generateCards>[0]);
      if (!r.ok) {
        setError(msg(r.error ?? "Something went wrong. Please try again."));
        setResult(null);
      } else setResult(r.data!);
    });
  }

  if (!open)
    return (
      <button type="button" className="btn btn-sm mb-4" onClick={() => setOpen(true)}>
        <span aria-hidden="true" className="text-[var(--warm)]">✦</span> {T("Generate cards", "Générer des cartes", "أنشئ بطاقات")}
      </button>
    );

  const cards: CarouselCard[] =
    result?.kind === "cards"
      ? result.cards.map((g) => ({ ...g, tag: T("Generated", "Générée", "مُنشأة") }))
      : [];

  return (
    <section aria-labelledby="gen-title" className="mb-6 rounded-[24px] border border-rule bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="gen-title" className="text-base font-semibold">{T("Generate cards", "Générer des cartes", "أنشئ بطاقات")}</h2>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOpen(false)}>
          {T("Close", "Fermer", "إغلاق")}
        </button>
      </div>

      {!available ? (
        <p className="mt-2 text-sm text-muted">
          {T(
            "AI card generation isn’t available on this site yet. The verse cards below are curated by people.",
            "La génération de cartes par IA n’est pas encore disponible. Les cartes ci-dessous sont choisies par des personnes.",
            "إنشاء البطاقات بالذكاء الاصطناعي غير متاح بعد. البطاقات أدناه اختارها أشخاص.",
          )}
        </p>
      ) : !canUse ? (
        <p className="mt-2 text-sm text-muted">
          <Link className="underline" href="/auth/sign-in?next=/flashcards">
            {T("Sign in", "Connectez-vous", "سجّل الدخول")}
          </Link>{" "}
          {T("to generate cards.", "pour générer des cartes.", "لإنشاء بطاقات.")}
        </p>
      ) : (
        <form onSubmit={submit} className="mt-3 space-y-3">
          <div role="radiogroup" aria-label={T("Generate from", "Générer à partir de", "أنشئ من")} className="flex rounded-full border border-rule p-1 text-sm">
            {(["topic", "chapter", "goal"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-full px-3 py-1.5 font-semibold ${mode === m ? "bg-gold text-[var(--on-accent)]" : "text-muted"}`}
              >
                {m === "topic" ? T("Topic", "Thème", "موضوع") : m === "chapter" ? T("Chapter", "Chapitre", "أصحاح") : T("Goal", "Objectif", "هدف")}
              </button>
            ))}
          </div>

          {mode === "topic" && (
            <div>
              <label htmlFor="gen-topic" className="label">{T("Topic", "Thème", "الموضوع")}</label>
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
                <label htmlFor="gen-book" className="label">{T("Book", "Livre", "السفر")}</label>
                <select id="gen-book" className="input" value={book} onChange={(e) => { setBook(e.target.value); setChapter(1); }}>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-24 shrink-0">
                <label htmlFor="gen-ch" className="label">{T("Chapter", "Chapitre", "الأصحاح")}</label>
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
              <label htmlFor="gen-goal" className="label">{T("Your goal", "Votre objectif", "هدفك")}</label>
              <input id="gen-goal" className="input" maxLength={300} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder={T("e.g. Be more patient with my children", "ex. : Être plus patient avec mes enfants", "مثلًا: أن أكون أكثر صبرًا مع أولادي")} />
              <p className="mt-1 text-xs text-muted">
                {T("Only these words are sent to our AI provider. Your notes and journal are never sent.", "Seuls ces mots sont envoyés à notre fournisseur d’IA. Vos notes et votre journal ne le sont jamais.", "تُرسل هذه الكلمات فقط إلى مزوّد الذكاء الاصطناعي. لا تُرسل ملاحظاتك ودفترك أبدًا.")}
              </p>
            </div>
          )}

          <button className="btn btn-primary w-full" disabled={pending || (mode === "goal" && goal.trim().length < 3)} aria-busy={pending}>
            {pending ? T("Choosing passages…", "Choix des passages…", "جارٍ اختيار المقاطع…") : T("Generate 3–5 cards", "Générer 3 à 5 cartes", "أنشئ 3–5 بطاقات")}
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
            {T(
              "It sounds like you may be going through something very hard. Please reach out to someone you trust or a local helpline — ",
              "Vous semblez traverser quelque chose de très difficile. Contactez une personne de confiance ou une ligne d’écoute — ",
              "يبدو أنك تمرّ بشيء صعب جدًا. تواصل مع شخص تثق به أو مع خط مساعدة محلي — ",
            )}
            <a className="underline" href="https://findahelpline.com/" target="_blank" rel="noopener noreferrer">findahelpline.com</a>.
          </p>
        )}
        {result?.kind === "cards" && (
          <div className="mt-4">
            <p className="mb-3 text-xs text-muted">
              {T(
                "Not saved yet — tap Save on the cards you want to keep. Verse text comes from the Bible edition; the reflection is AI-written and may be imperfect.",
                "Pas encore enregistrées — touchez Enregistrer sur celles à garder. Le texte vient de l’édition biblique ; la réflexion est écrite par IA et peut être imparfaite.",
                "لم تُحفظ بعد — اضغط «حفظ» على البطاقات التي تريدها. نص الآيات من طبعة الكتاب المقدس؛ والتأمل كتبه الذكاء الاصطناعي وقد يكون غير دقيق.",
              )}
              {result.cached
                ? " " + T("(Reused from an earlier request.)", "(Réutilisé d’une demande précédente.)", "(أُعيد استخدامه من طلب سابق.)")
                : result.remainingToday !== undefined
                  ? " " + T(`${result.remainingToday} AI requests left today.`, `${result.remainingToday} demandes d’IA restantes aujourd’hui.`, `تبقّى ${result.remainingToday} طلبات اليوم.`)
                  : ""}
            </p>
            <VerseCarousel cards={cards} labels={{ ...labels, reflection: labels.aiReflection ?? "AI reflection" }} canSave={canUse} ariaLabel={T("Generated cards", "Cartes générées", "البطاقات المنشأة")} />
          </div>
        )}
      </div>
    </section>
  );
}
