"use client";

import { useState, useTransition } from "react";
import { setWatchState } from "@/app/actions/watchlist";
import { useMsg, useT } from "./LocaleProvider";

export function WatchControls({ slug, initial }: { slug: string; initial: "none" | "want" | "watched" }) {
  const [state, setState] = useState(initial);
  const T = useT();
  const msg = useMsg();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (next: typeof state) => {
    const prev = state;
    setState(next);
    start(async () => {
      const r = await setWatchState(slug, next);
      if (!r.ok) {
        setState(prev);
        setError(r.error);
      }
    });
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button className={`btn btn-sm ${state !== "none" ? "btn-primary" : ""}`} aria-pressed={state !== "none"} disabled={pending} aria-busy={pending} onClick={() => set(state === "none" ? "want" : "none")}>
        {state === "none" ? T("+ Watchlist", "+ Ma liste", "+ قائمتي") : T("On your watchlist", "Dans votre liste", "في قائمتك")}
      </button>
      <button className={`btn btn-sm ${state === "watched" ? "btn-primary" : ""}`} aria-pressed={state === "watched"} disabled={pending} aria-busy={pending} onClick={() => set(state === "watched" ? "want" : "watched")}>
        {state === "watched" ? T("✓ Watched", "✓ Vu", "✓ شوهد") : T("Mark watched", "Marquer comme vu", "علّم كمُشاهَد")}
      </button>
      {error && <p role="alert" className="text-sm text-danger">{msg(error)}</p>}
    </div>
  );
}
