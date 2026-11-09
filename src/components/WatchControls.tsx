"use client";

import { useState, useTransition } from "react";
import { setWatchState } from "@/app/actions/watchlist";

export function WatchControls({ slug, initial }: { slug: string; initial: "none" | "want" | "watched" }) {
  const [state, setState] = useState(initial);
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
        {state === "none" ? "+ Watchlist" : "On your watchlist"}
      </button>
      <button className={`btn btn-sm ${state === "watched" ? "btn-primary" : ""}`} aria-pressed={state === "watched"} disabled={pending} aria-busy={pending} onClick={() => set(state === "watched" ? "want" : "watched")}>
        {state === "watched" ? "✓ Watched" : "Mark watched"}
      </button>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
