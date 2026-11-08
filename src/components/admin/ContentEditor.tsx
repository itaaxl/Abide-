"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteContent, saveContent } from "@/app/actions/admin";

type Kind = "daily" | "plan" | "topic" | "media";

export function ContentEditor({ kind, initial, id, status }: { kind: Kind; initial: string; id?: string; status?: string }) {
  const router = useRouter();
  const [json, setJson] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const save = (s: "draft" | "published") =>
    start(async () => {
      const r = await saveContent(kind, json, s);
      setMsg(r.ok ? { ok: true, text: `Saved as ${s}.` } : { ok: false, text: r.error });
      if (r.ok) router.refresh();
    });
  return (
    <div className="space-y-2">
      <label className="sr-only" htmlFor={`ed-${kind}-${id ?? "new"}`}>JSON</label>
      <textarea id={`ed-${kind}-${id ?? "new"}`} className="input min-h-40 font-mono text-xs" value={json} onChange={(e) => setJson(e.target.value)} spellCheck={false} />
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn btn-sm" disabled={pending} onClick={() => save("draft")}>Save draft</button>
        <button className="btn btn-sm btn-primary" disabled={pending} onClick={() => save("published")}>Publish</button>
        {id && (
          <button
            className="btn btn-sm btn-danger"
            disabled={pending}
            onClick={() => confirm(`Delete ${id}? Seed content (if any) will show again.`) && start(async () => { const r = await deleteContent(kind, id); if (r.ok) router.refresh(); else setMsg({ ok: false, text: r.error }); })}
          >
            Delete override
          </button>
        )}
        {status && <span className="text-xs text-muted">Current: {status}</span>}
        {msg && <span role="status" className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</span>}
      </div>
    </div>
  );
}
