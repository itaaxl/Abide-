"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addCustomCard,
  createDeck,
  deleteCard,
  deleteDeck,
  duplicateCardToEdition,
  resetDeck,
  setDailyTarget,
  updateDeck,
} from "@/app/actions/flashcards";
import { useMsg, useT } from "../LocaleProvider";

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const tr = useMsg();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success?: string, after?: () => void) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? (success ? { ok: true, text: success } : null) : { ok: false, text: r.error ?? "Something went wrong. Please try again." });
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });
  const Msg = () => (msg ? <p role="status" className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{tr(msg.text)}</p> : null);
  return { pending, run, Msg };
}

export function NewDeckForm() {
  const { pending, run, Msg } = useAction();
  const T = useT();
  const [name, setName] = useState("");
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => createDeck(name), T("Deck created", "Paquet créé", "أُنشئت المجموعة"), () => setName(""));
      }}
    >
      <div className="flex-1">
        <label htmlFor="deckname" className="label">{T("New deck", "Nouveau paquet", "مجموعة جديدة")}</label>
        <input id="deckname" className="input" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder={T("e.g. Psalms of comfort", "ex. : Psaumes de réconfort", "مثلًا: مزامير التعزية")} required />
      </div>
      <button className="btn" disabled={pending} aria-busy={pending}>{T("Create", "Créer", "إنشاء")}</button>
      <div className="w-full"><Msg /></div>
    </form>
  );
}

export function DailyTargetForm({ value }: { value: number }) {
  const { pending, run, Msg } = useAction();
  const T = useT();
  const [v, setV] = useState(value);
  return (
    <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); run(() => setDailyTarget(v), T("Saved", "Enregistré", "حُفظ")); }}>
      <div>
        <label htmlFor="target" className="label">{T("Daily review goal", "Objectif quotidien", "هدف المراجعة اليومي")}</label>
        <input id="target" type="number" min={1} max={200} className="input w-28" value={v} onChange={(e) => setV(Number(e.target.value))} />
      </div>
      <button className="btn" disabled={pending} aria-busy={pending}>{T("Save", "Enregistrer", "حفظ")}</button>
      <Msg />
    </form>
  );
}

export function DeckSettings({ id, name, description }: { id: string; name: string; description: string }) {
  const router = useRouter();
  const { pending, run, Msg } = useAction();
  const T = useT();
  const [n, setN] = useState(name);
  const [d, setD] = useState(description);
  return (
    <div className="space-y-4">
      <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); run(() => updateDeck(id, n, d), T("Saved", "Enregistré", "حُفظ")); }}>
        <label htmlFor="dn" className="label">{T("Name", "Nom", "الاسم")}</label>
        <input id="dn" className="input" value={n} maxLength={80} onChange={(e) => setN(e.target.value)} />
        <label htmlFor="dd" className="label">{T("Description", "Description", "الوصف")}</label>
        <input id="dd" className="input" value={d} maxLength={500} onChange={(e) => setD(e.target.value)} />
        <button className="btn w-fit" disabled={pending} aria-busy={pending}>{T("Save deck", "Enregistrer le paquet", "حفظ المجموعة")}</button>
      </form>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-sm" disabled={pending} aria-busy={pending} onClick={() => confirm(T("Reset progress for every card in this deck? Review history for these cards will be removed. Cards stay in the deck.", "Réinitialiser la progression de toutes les cartes ? L’historique sera supprimé ; les cartes restent.", "إعادة ضبط التقدّم لكل البطاقات؟ سيُحذف سجل المراجعة وتبقى البطاقات.")) && run(() => resetDeck(id), T("Progress reset", "Progression réinitialisée", "أُعيد ضبط التقدّم"))}>
          {T("Reset progress", "Réinitialiser", "إعادة ضبط التقدّم")}
        </button>
        <button className="btn btn-sm btn-danger" disabled={pending} aria-busy={pending} onClick={() => confirm(T("Delete this deck and all its cards? This cannot be undone.", "Supprimer ce paquet et toutes ses cartes ? C’est irréversible.", "حذف هذه المجموعة وكل بطاقاتها؟ لا يمكن التراجع.")) && run(() => deleteDeck(id), undefined, () => router.push("/flashcards"))}>
          {T("Delete deck", "Supprimer le paquet", "حذف المجموعة")}
        </button>
      </div>
      <Msg />
    </div>
  );
}

export function CustomCardForm({ deckId }: { deckId: string }) {
  const { pending, run, Msg } = useAction();
  const T = useT();
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  return (
    <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); run(() => addCustomCard(deckId, front, back), T("Card added", "Carte ajoutée", "أُضيفت البطاقة"), () => { setFront(""); setBack(""); }); }}>
      <p className="text-sm text-muted">{T("Your own question-and-answer cards are shown with a “not Scripture” label.", "Vos cartes question-réponse portent la mention « pas l’Écriture ».", "تظهر بطاقات السؤال والجواب الخاصة بك بعلامة «ليست من الكتاب المقدس».")}</p>
      <label htmlFor="cf" className="label">{T("Question", "Question", "السؤال")}</label>
      <textarea id="cf" className="input" maxLength={1000} value={front} onChange={(e) => setFront(e.target.value)} required />
      <label htmlFor="cb" className="label">{T("Answer", "Réponse", "الجواب")}</label>
      <textarea id="cb" className="input" maxLength={2000} value={back} onChange={(e) => setBack(e.target.value)} required />
      <button className="btn w-fit" disabled={pending} aria-busy={pending}>{T("Add card", "Ajouter la carte", "أضف البطاقة")}</button>
      <Msg />
    </form>
  );
}

export function CardRowControls({ id, scripture, editions }: { id: string; scripture: boolean; editions: { id: string; abbr: string }[] }) {
  const { pending, run, Msg } = useAction();
  const T = useT();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {scripture && (
        <select
          aria-label={T("Copy this card into another translation", "Copier cette carte dans une autre traduction", "انسخ البطاقة إلى ترجمة أخرى")}
          className="input w-auto py-1 text-sm"
          defaultValue=""
          disabled={pending} aria-busy={pending}
          onChange={(e) => {
            const v = e.target.value;
            e.target.value = "";
            if (v) run(() => duplicateCardToEdition(id, v), T("Copied (original kept)", "Copiée (original conservé)", "نُسخت (مع الإبقاء على الأصل)"));
          }}
        >
          <option value="">{T("Copy to translation…", "Copier vers…", "انسخ إلى ترجمة…")}</option>
          {editions.map((e) => <option key={e.id} value={e.id}>{e.abbr}</option>)}
        </select>
      )}
      <button className="btn btn-sm btn-ghost btn-danger" disabled={pending} aria-busy={pending} onClick={() => confirm(T("Delete this card?", "Supprimer cette carte ?", "حذف هذه البطاقة؟")) && run(() => deleteCard(id))}>
        {T("Delete", "Supprimer", "حذف")}
      </button>
      <Msg />
    </div>
  );
}
