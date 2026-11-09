"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteEntry, saveEntry, type EntryInput } from "@/app/actions/journal";

const PROMPTS = [
  "Something I’m grateful for today…",
  "My intention for today is…",
  "Something I noticed in today’s reading…",
  "I’m bringing this to God…",
  "A prayer for someone else…",
];

/**
 * Drafts are kept in sessionStorage under a key that includes the user id,
 * so they survive an accidental reload but disappear when the tab closes and
 * are never shown to a different account on a shared device.
 */
export function EntryEditor({ userId, initial, today }: { userId: string; initial?: EntryInput & { id: string }; today: string }) {
  const router = useRouter();
  const draftKey = `abide:journal-draft:${userId}:${initial?.id ?? "new"}`;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [refs, setRefs] = useState((initial?.refs ?? []).join(", "));
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [status, setStatus] = useState<EntryInput["status"]>(initial?.status ?? "ongoing");
  const [date, setDate] = useState(initial?.entryDate ?? today);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [restored, setRestored] = useState(false);
  const [pending, start] = useTransition();
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (raw) {
        const d = JSON.parse(raw);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a draft once on mount
        setTitle(d.title ?? "");
        setBody(d.body ?? "");
        setRestored(true);
      }
    } catch {
      /* ignore */
    }
  }, [draftKey]);

  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => {
      try {
        if (title || body) sessionStorage.setItem(draftKey, JSON.stringify({ title, body }));
      } catch {
        /* ignore */
      }
    }, 600);
    return () => clearTimeout(t);
  }, [title, body, draftKey]);

  const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await saveEntry({ id: initial?.id, title, body, refs: split(refs), tags: split(tags), status, entryDate: date });
      if (!r.ok) {
        setMsg({ ok: false, text: r.error });
        return;
      }
      try {
        sessionStorage.removeItem(draftKey);
      } catch {
        /* ignore */
      }
      setMsg({ ok: true, text: "Saved privately." });
      if (!initial) router.push(`/journal/${r.data!.id}`);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {restored && (
        <p role="status" className="rounded-lg bg-gold-soft/30 p-3 text-sm">
          We restored an unsaved draft from this browser tab.
        </p>
      )}
      <div>
        <label htmlFor="jt" className="label">Title</label>
        <input id="jt" className="input" maxLength={140} value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="jb" className="label">Your words</label>
        <div className="mb-2 flex flex-wrap gap-1" aria-label="Optional reflection prompts">
          {PROMPTS.map((p) => (
            <button type="button" key={p} className="btn btn-sm btn-ghost" onClick={() => setBody((b) => (b ? `${b}\n\n${p} ` : `${p} `))}>
              {p}
            </button>
          ))}
        </div>
        <textarea
          id="jb"
          className="input min-h-[40vh] font-serif text-lg leading-relaxed"
          maxLength={20000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          autoCapitalize="sentences"
        />
        <p className="mt-1 text-xs text-muted">{body.length.toLocaleString()} / 20,000 · Journal entries are never sent to AI.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="jr" className="label">Passages (optional, comma-separated)</label>
          <input id="jr" className="input" value={refs} onChange={(e) => setRefs(e.target.value)} placeholder="Psalm 23, John 14:27" />
        </div>
        <div>
          <label htmlFor="jg" className="label">Tags (optional)</label>
          <input id="jg" className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="family, work" />
        </div>
        <div>
          <label htmlFor="js" className="label">Status (your choice)</label>
          <select id="js" className="input" value={status} onChange={(e) => setStatus(e.target.value as EntryInput["status"])}>
            <option value="ongoing">Ongoing prayer</option>
            <option value="answered">Answered</option>
            <option value="reflection">Reflection</option>
          </select>
        </div>
        <div>
          <label htmlFor="jd" className="label">Date</label>
          <input id="jd" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn btn-primary" disabled={pending} aria-busy={pending}>Save privately</button>
        {initial && (
          <button
            type="button"
            className="btn btn-danger"
            disabled={pending} aria-busy={pending}
            onClick={() =>
              confirm("Delete this entry permanently?") &&
              start(async () => {
                const r = await deleteEntry(initial.id);
                if (r.ok) router.push("/journal");
                else setMsg({ ok: false, text: r.error });
              })
            }
          >
            Delete
          </button>
        )}
        {msg && <p role="status" className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
      </div>
    </form>
  );
}
