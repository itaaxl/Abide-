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

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success?: string, after?: () => void) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? (success ? { ok: true, text: success } : null) : { ok: false, text: r.error ?? "Failed" });
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });
  const Msg = () => (msg ? <p role="status" className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p> : null);
  return { pending, run, Msg };
}

export function NewDeckForm() {
  const { pending, run, Msg } = useAction();
  const [name, setName] = useState("");
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => createDeck(name), "Deck created", () => setName(""));
      }}
    >
      <div className="flex-1">
        <label htmlFor="deckname" className="label">New deck</label>
        <input id="deckname" className="input" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Psalms of comfort" required />
      </div>
      <button className="btn" disabled={pending}>Create</button>
      <div className="w-full"><Msg /></div>
    </form>
  );
}

export function DailyTargetForm({ value }: { value: number }) {
  const { pending, run, Msg } = useAction();
  const [v, setV] = useState(value);
  return (
    <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); run(() => setDailyTarget(v), "Saved"); }}>
      <div>
        <label htmlFor="target" className="label">Daily review goal</label>
        <input id="target" type="number" min={1} max={200} className="input w-28" value={v} onChange={(e) => setV(Number(e.target.value))} />
      </div>
      <button className="btn" disabled={pending}>Save</button>
      <Msg />
    </form>
  );
}

export function DeckSettings({ id, name, description }: { id: string; name: string; description: string }) {
  const router = useRouter();
  const { pending, run, Msg } = useAction();
  const [n, setN] = useState(name);
  const [d, setD] = useState(description);
  return (
    <div className="space-y-4">
      <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); run(() => updateDeck(id, n, d), "Saved"); }}>
        <label htmlFor="dn" className="label">Name</label>
        <input id="dn" className="input" value={n} maxLength={80} onChange={(e) => setN(e.target.value)} />
        <label htmlFor="dd" className="label">Description</label>
        <input id="dd" className="input" value={d} maxLength={500} onChange={(e) => setD(e.target.value)} />
        <button className="btn w-fit" disabled={pending}>Save deck</button>
      </form>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-sm" disabled={pending} onClick={() => confirm("Reset progress for every card in this deck? Review history for these cards will be removed. Cards stay in the deck.") && run(() => resetDeck(id), "Progress reset")}>
          Reset progress
        </button>
        <button className="btn btn-sm btn-danger" disabled={pending} onClick={() => confirm("Delete this deck and all its cards? This cannot be undone.") && run(() => deleteDeck(id), undefined, () => router.push("/flashcards"))}>
          Delete deck
        </button>
      </div>
      <Msg />
    </div>
  );
}

export function CustomCardForm({ deckId }: { deckId: string }) {
  const { pending, run, Msg } = useAction();
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  return (
    <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); run(() => addCustomCard(deckId, front, back), "Card added", () => { setFront(""); setBack(""); }); }}>
      <p className="text-sm text-muted">Your own question-and-answer cards are shown with a “not Scripture” label.</p>
      <label htmlFor="cf" className="label">Question</label>
      <textarea id="cf" className="input" maxLength={1000} value={front} onChange={(e) => setFront(e.target.value)} required />
      <label htmlFor="cb" className="label">Answer</label>
      <textarea id="cb" className="input" maxLength={2000} value={back} onChange={(e) => setBack(e.target.value)} required />
      <button className="btn w-fit" disabled={pending}>Add card</button>
      <Msg />
    </form>
  );
}

export function CardRowControls({ id, scripture, editions }: { id: string; scripture: boolean; editions: { id: string; abbr: string }[] }) {
  const { pending, run, Msg } = useAction();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {scripture && (
        <select
          aria-label="Copy this card into another translation"
          className="input w-auto py-1 text-sm"
          defaultValue=""
          disabled={pending}
          onChange={(e) => {
            const v = e.target.value;
            e.target.value = "";
            if (v) run(() => duplicateCardToEdition(id, v), "Copied (original kept)");
          }}
        >
          <option value="">Copy to translation…</option>
          {editions.map((e) => <option key={e.id} value={e.id}>{e.abbr}</option>)}
        </select>
      )}
      <button className="btn btn-sm btn-ghost btn-danger" disabled={pending} onClick={() => confirm("Delete this card?") && run(() => deleteCard(id))}>
        Delete
      </button>
      <Msg />
    </div>
  );
}
