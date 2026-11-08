"use client";

import { useEffect, useRef, useState } from "react";

/** Optional quiet prayer timer. Silent by default; a soft tone only if the user enables it. */
export function PrayerTimer() {
  const [minutes, setMinutes] = useState(3);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [sound, setSound] = useState(false);
  const [finished, setFinished] = useState(false);
  const soundRef = useRef(sound);
  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  useEffect(() => {
    if (remaining === null || paused) return;
    if (remaining <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- timer completion
      setRemaining(null);
      setFinished(true);
      if (soundRef.current) chime();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => (r ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, paused]);

  const mm = remaining !== null ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}` : null;

  return (
    <section className="card p-5" aria-labelledby="timer-h">
      <h2 id="timer-h" className="font-serif text-xl">Quiet prayer timer</h2>
      {remaining === null ? (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div role="group" aria-label="Duration" className="flex gap-1">
            {[1, 3, 5, 10].map((m) => (
              <button key={m} className={`btn btn-sm ${minutes === m ? "btn-primary" : ""}`} aria-pressed={minutes === m} onClick={() => setMinutes(m)}>
                {m} min
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} className="h-5 w-5" /> Soft tone at the end
          </label>
          <button
            className="btn btn-primary"
            onClick={() => {
              setFinished(false);
              setPaused(false);
              setRemaining(minutes * 60);
            }}
          >
            Begin
          </button>
          {finished && <p role="status" className="w-full text-sm text-success">Time is complete. Take your time returning.</p>}
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-4">
          <p className="font-serif text-5xl tabular-nums" aria-live="off">{mm}</p>
          <button className="btn btn-sm" onClick={() => setPaused((p) => !p)}>{paused ? "Resume" : "Pause"}</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setRemaining(null)}>End</button>
        </div>
      )}
    </section>
  );
}

function chime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 528;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 2.6);
  } catch {
    /* audio unavailable */
  }
}
