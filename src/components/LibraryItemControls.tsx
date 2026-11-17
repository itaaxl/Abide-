"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteBookmark, deleteNote, setBookmarkTags } from "@/app/actions/annotations";
import { deleteHighlight } from "@/app/actions/library";
import { SUGGESTED_TAGS, TAG_LABELS } from "@/lib/annotations";
import { useMsg, useT } from "./LocaleProvider";

export function LibraryItemControls({ kind, id, tags = [] }: { kind: "bookmarks" | "highlights" | "notes"; id: string; tags?: string[] }) {
  const router = useRouter();
  const T = useT();
  const msg = useMsg();
  const [current, setCurrent] = useState(tags);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function toggleTag(t: string) {
    const prev = current;
    const next = prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t];
    setCurrent(next);
    start(async () => {
      const r = await setBookmarkTags(id, next);
      if (!r.ok) {
        setCurrent(prev);
        setError(r.error);
      }
    });
  }

  function remove() {
    if (!confirm(T("Remove this item from your library?", "Retirer cet élément de votre bibliothèque ?", "إزالة هذا العنصر من مكتبتك؟"))) return;
    start(async () => {
      const r = kind === "bookmarks" ? await deleteBookmark(id) : kind === "notes" ? await deleteNote(id) : await deleteHighlight(id);
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1">
      {kind === "bookmarks" &&
        SUGGESTED_TAGS.map((t) => (
          <button key={t} className={`btn btn-sm ${current.includes(t) ? "btn-primary" : "btn-ghost"}`} aria-pressed={current.includes(t)} onClick={() => toggleTag(t)} disabled={pending} aria-busy={pending}>
            {TAG_LABELS[t] ? T(...TAG_LABELS[t]) : t}
          </button>
        ))}
      <button className="btn btn-sm btn-ghost btn-danger ms-auto" onClick={remove} disabled={pending} aria-busy={pending}>
        {T("Remove", "Retirer", "إزالة")}
      </button>
      {error && <p role="alert" className="w-full text-sm text-danger">{msg(error)}</p>}
    </div>
  );
}
