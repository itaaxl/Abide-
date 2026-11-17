"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { requestGuidance, saveGuidance } from "@/app/actions/guidance";
import type { GuidanceResult } from "@/lib/guidance/schema";
import { useLocale, useT } from "../LocaleProvider";
import { PassageActions } from "../PassageActions";

const TOPICS = [
  ["anxiety", "Anxiety", "Anxiété", "القلق"],
  ["grief", "Grief", "Deuil", "الحزن"],
  ["anger", "Anger", "Colère", "الغضب"],
  ["forgiveness", "Forgiveness", "Pardon", "الغفران"],
  ["motivation", "Motivation", "Motivation", "الهمّة"],
  ["gratitude", "Gratitude", "Gratitude", "الشكر"],
  ["relationships", "Relationships", "Relations", "العلاقات"],
  ["closer-to-god", "Growing closer to God", "Se rapprocher de Dieu", "الاقتراب من الله"],
  ["doubt", "Doubt", "Doute", "الشك"],
  ["hope", "Hope", "Espérance", "الرجاء"],
] as const;

function fallbackText(T: ReturnType<typeof useT>, reason: NonNullable<GuidanceResult["fallbackReason"]>): string {
  switch (reason) {
    case "unconfigured": return T("AI suggestions aren’t available on this site right now.", "Les suggestions par IA ne sont pas disponibles sur ce site pour le moment.", "اقتراحات الذكاء الاصطناعي غير متاحة على هذا الموقع حاليًا.");
    case "quota": return T("The free AI allowance has been reached for now (your daily limit or the site’s shared free quota).", "Le quota gratuit d’IA est atteint pour le moment (votre limite quotidienne ou celle du site).", "تم بلوغ الحدّ المجاني للذكاء الاصطناعي حاليًا (حدّك اليومي أو الحدّ المشترك للموقع).");
    case "provider-error": return T("The AI service didn’t respond just now.", "Le service d’IA n’a pas répondu.", "لم تستجب خدمة الذكاء الاصطناعي الآن.");
    case "refusal": return T("The AI service declined this request.", "Le service d’IA a refusé cette demande.", "رفضت خدمة الذكاء الاصطناعي هذا الطلب.");
    case "malformed": return T("The AI response couldn’t be verified, so we didn’t show it.", "La réponse de l’IA n’a pas pu être vérifiée ; elle n’est donc pas affichée.", "تعذّر التحقق من ردّ الذكاء الاصطناعي، لذا لم نعرضه.");
    default: return T("We couldn’t find closely matching passages.", "Aucun passage ne correspond vraiment.", "لم نجد مقاطع مطابقة بدقّة.");
  }
}

/**
 * A guest's unsent request survives sign-in in this tab's sessionStorage only
 * (never the URL, cookies, or analytics). It is restored for review — never
 * sent automatically — and cleared on submit, discard, tab close, after 30
 * minutes, or when a different account signs in on this device.
 */
const DRAFT_KEY = "abide:guidance-draft";
const DRAFT_TTL = 30 * 60 * 1000;
interface Draft {
  text: string;
  topic?: string;
  tone?: string;
  at: number;
  /** Account that first restored it; any other account discards it. */
  owner?: string;
}
function readDraft(): Draft | null {
  try {
    const d = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null") as Draft | null;
    if (!d || typeof d.text !== "string" || Date.now() - d.at > DRAFT_TTL) return clearDraft(), null;
    return d;
  } catch {
    return null;
  }
}
function writeDraft(d: Draft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {
    /* storage unavailable: nothing is kept */
  }
}
function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export function GuidanceForm({
  edition,
  maxChars,
  canUse,
  signInHref,
  userId,
}: {
  edition: string;
  maxChars: number;
  canUse: boolean;
  signInHref: string;
  userId?: string;
}) {
  const T = useT();
  const locale = useLocale();
  const [text, setText] = useState("");
  const [topic, setTopic] = useState<string | undefined>();
  const [tone, setTone] = useState<string | undefined>();
  const [restored, setRestored] = useState(false);

  // Offer a kept request back: after sign-in for that person only, or to the
  // guest who returns without signing in. A draft already claimed by an
  // account is discarded once nobody (or someone else) is signed in.
  useEffect(() => {
    const d = readDraft();
    if (!d) return;
    if (d.owner && d.owner !== (canUse ? userId : undefined)) return clearDraft();
    if (canUse && userId) writeDraft({ ...d, owner: userId });
    /* eslint-disable react-hooks/set-state-in-effect -- restoring browser-only storage after hydration */
    setText(d.text.slice(0, maxChars));
    setTopic(d.topic);
    setTone(d.tone);
    setRestored(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [canUse, userId, maxChars]);

  function keepDraftForSignIn() {
    if (text.trim()) writeDraft({ text: text.slice(0, maxChars), topic, tone, at: Date.now() });
  }

  function discardDraft() {
    clearDraft();
    setText("");
    setTopic(undefined);
    setTone(undefined);
    setRestored(false);
  }
  const [result, setResult] = useState<GuidanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(null);
    clearDraft();
    setRestored(false);
    start(async () => {
      const r = await requestGuidance({ text, topic, tone, edition, locale });
      if (!r.ok) setError(r.error);
      else setResult(r.data!);
    });
  }

  function save() {
    if (!result || result.kind === "crisis" || result.kind === "clarify") return;
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
      setSaved(r.ok ? T("Saved privately to your library.", "Enregistré en privé dans votre bibliothèque.", "حُفظ بشكل خاص في مكتبتك.") : r.error);
    });
  }

  return (
    <div>
      {restored && (
        <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-gold-soft/40 p-4 text-sm">
          <p>{T("We kept the request you started before signing in. Review it, then press “Find passages” when you’re ready.", "Nous avons gardé la demande commencée avant votre connexion. Relisez-la, puis appuyez sur « Trouver des passages » quand vous êtes prêt.", "احتفظنا بالطلب الذي بدأته قبل تسجيل الدخول. راجعه ثم اضغط «ابحث عن مقاطع» عندما تكون مستعدًا.")}</p>
          <button type="button" className="btn btn-sm" onClick={discardDraft}>
            {T("Discard", "Supprimer", "تجاهل")}
          </button>
        </div>
      )}
      <form onSubmit={submit} className="card space-y-4 p-6">
        <fieldset>
          <legend className="label">{T("Choose a topic (optional)", "Choisir un thème (facultatif)", "اختر موضوعًا (اختياري)")}</legend>
          <div className="flex flex-wrap gap-1">
            {TOPICS.map(([slug, en, fr, ar]) => (
              <button type="button" key={slug} className={`btn btn-sm ${topic === slug ? "btn-primary" : ""}`} aria-pressed={topic === slug} onClick={() => setTopic(topic === slug ? undefined : slug)}>
                {T(en, fr, ar)}
              </button>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="gtext" className="label">{T("What are you facing, hoping for, or trying to grow in?", "Qu’affrontez-vous, qu’espérez-vous, ou dans quoi voulez-vous grandir ?", "ما الذي تواجهه أو ترجوه أو تريد أن تنمو فيه؟")}</label>
          <textarea
            id="gtext"
            className="input min-h-32"
            maxLength={maxChars}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={T("For example: I’m worried about my job and can’t sleep.", "Par exemple : je m’inquiète pour mon travail et je n’arrive pas à dormir.", "مثلًا: أنا قلق بشأن عملي ولا أستطيع النوم.")}
            required
            aria-describedby="gtext-help"
          />
          <p id="gtext-help" className="mt-1 text-xs text-muted">
            {text.length}/{maxChars}. {T("You don’t need to share names or personal details. This text is sent to our AI provider to choose passages; it is not saved unless you press “Save”.", "Inutile de donner des noms ou des détails personnels. Ce texte est envoyé à notre fournisseur d’IA pour choisir des passages ; il n’est pas conservé sauf si vous appuyez sur « Enregistrer ».", "لا حاجة لذكر أسماء أو تفاصيل شخصية. يُرسل هذا النص إلى مزوّد الذكاء الاصطناعي لاختيار المقاطع، ولا يُحفظ إلا إذا ضغطت «حفظ».")}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="gtone" className="label">{T("Tone (optional)", "Ton (facultatif)", "الأسلوب (اختياري)")}</label>
            <select id="gtone" className="input w-auto" value={tone ?? ""} onChange={(e) => setTone(e.target.value || undefined)}>
              <option value="">{T("No preference", "Sans préférence", "بلا تفضيل")}</option>
              <option value="gentle">{T("Gentle", "Doux", "لطيف")}</option>
              <option value="encouraging">{T("Encouraging", "Encourageant", "مشجّع")}</option>
              <option value="reflective">{T("Reflective", "Méditatif", "تأمّلي")}</option>
              <option value="practical">{T("Practical", "Pratique", "عملي")}</option>
            </select>
          </div>
          {canUse ? (
            <button className="btn btn-primary" disabled={pending || text.trim().length < 3} aria-busy={pending}>
              {pending ? T("Finding passages…", "Recherche de passages…", "جارٍ البحث عن مقاطع…") : T("Find passages", "Trouver des passages", "ابحث عن مقاطع")}
            </button>
          ) : (
            <Link href={signInHref} className="btn btn-primary" onClick={keepDraftForSignIn}>
              {T("Sign in to continue", "Se connecter pour continuer", "سجّل الدخول للمتابعة")}
            </Link>
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
              {T("Find a helpline (findahelpline.com)", "Trouver une ligne d’écoute (findahelpline.com)", "ابحث عن خط مساعدة (findahelpline.com)")}
            </a>
          </section>
        )}

        {result?.kind === "clarify" && (
          <section role="status" className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{T("A quick question", "Une petite question", "سؤال سريع")}</p>
            <p className="mt-1 leading-relaxed">{result.opening}</p>
            <p className="mt-2 text-sm text-muted">{T("Add a little more detail above and press the button again.", "Ajoutez un peu plus de détails ci-dessus et appuyez de nouveau sur le bouton.", "أضف مزيدًا من التفاصيل أعلاه ثم اضغط الزر مجددًا.")}</p>
          </section>
        )}

        {result && result.kind !== "crisis" && result.kind !== "clarify" && (
          <section className="space-y-6">
            {result.kind === "fallback" && (
              <p role="status" className="rounded-lg border border-rule bg-gold-soft/30 p-4 text-sm">
                {fallbackText(T, result.fallbackReason ?? "unconfigured")}{" "}
                {T("Below are passages selected from our curated topic lists (chosen by people, not by AI) that match words in your request.", "Voici des passages tirés de nos listes thématiques (choisis par des personnes, pas par l’IA) qui correspondent à votre demande.", "إليك مقاطع من قوائمنا الموضوعية (اختارها أشخاص، لا الذكاء الاصطناعي) تطابق كلمات طلبك.")}
              </p>
            )}
            {result.opening && (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted">{T("AI-generated reflection — not Scripture", "Réflexion générée par IA — pas l’Écriture", "تأمّل من الذكاء الاصطناعي — ليس من الكتاب المقدس")}</p>
                <p className="mt-1 text-lg leading-relaxed">{result.opening}</p>
              </div>
            )}
            {result.passages.map((p) => (
              <article key={p.key} className="card p-6">
                <p className="eyebrow">{p.label} · {p.editionAbbr}</p>
                <blockquote className="mt-2 font-serif text-xl leading-relaxed" dir={p.direction}>{p.text}</blockquote>
                <div className="mt-4 rounded-lg bg-gold-soft/20 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted">
                    {result.kind === "ai" ? T("Why this passage may help (AI-generated, may be imperfect)", "Pourquoi ce passage peut aider (généré par IA, peut être imparfait)", "لماذا قد يساعد هذا المقطع (من الذكاء الاصطناعي، وقد يكون غير دقيق)") : T("Curated note", "Note éditoriale", "ملاحظة تحريرية")}
                  </p>
                  <p className="mt-1 leading-relaxed">{p.connection}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={p.href} className="btn btn-sm">{T("Open in Bible", "Ouvrir dans la Bible", "افتح في الكتاب المقدس")}</Link>
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
                <h2 className="text-base font-semibold">{T("Small steps you might take", "De petits pas possibles", "خطوات صغيرة قد تتخذها")}</h2>
                <ul className="mt-2 list-disc space-y-1 ps-6">{result.practicalSteps.map((s) => <li key={s}>{s}</li>)}</ul>
              </div>
            )}
            {result.prayer && (
              <div>
                <h2 className="text-base font-semibold">{T("A prayer you could use", "Une prière possible", "صلاة يمكنك استخدامها")}</h2>
                <p className="mt-2 italic leading-relaxed">{result.prayer}</p>
              </div>
            )}
            {result.suggestHumanSupport && (
              <p className="card p-4">{T("Talking with someone you trust — a friend, pastor, or counselor — could also help with what you’re carrying.", "Parler à une personne de confiance — un ami, un pasteur ou un conseiller — pourrait aussi vous aider.", "قد يساعدك أيضًا التحدّث مع شخص تثق به — صديق أو راعٍ أو مرشد.")}</p>
            )}
            <p className="text-sm text-muted">
              {T("Reading the whole chapter helps you see each passage in context. Christians in different traditions may read some passages differently.", "Lire tout le chapitre aide à voir chaque passage dans son contexte. Des chrétiens de traditions différentes peuvent comprendre certains passages différemment.", "قراءة الأصحاح كاملًا تساعدك على فهم كل مقطع في سياقه. قد يفهم مسيحيون من تقاليد مختلفة بعض المقاطع بطرق مختلفة.")}
              {result.remainingToday !== undefined && ` · ${T(`${result.remainingToday} AI requests left today.`, `${result.remainingToday} demandes d’IA restantes aujourd’hui.`, `تبقّى ${result.remainingToday} طلبات اليوم.`)}`}
            </p>
            {canUse && (
              <div className="flex items-center gap-3">
                <button className="btn" onClick={save} disabled={pending} aria-busy={pending}>{T("Save this guidance (private)", "Enregistrer (privé)", "احفظ هذا الإرشاد (خاص)")}</button>
                {saved && <p role="status" className="text-sm text-success">{saved}</p>}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
