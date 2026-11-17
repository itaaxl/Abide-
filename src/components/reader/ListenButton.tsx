"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "../LocaleProvider";

type State = "idle" | "playing" | "paused";

const LANG: Record<string, string> = { en: "en-US", fr: "fr-FR", ar: "ar" };

/**
 * Reads the chapter aloud with the device's own speech voice (Web Speech API).
 * Nothing is sent to a server; works offline when the device has a voice.
 * Speaks verse by verse so the current verse can be highlighted and so long
 * chapters aren't cut off by browser limits.
 */
export function ListenButton({ verses, language }: { verses: { v: number; t: string }[]; language: string }) {
  const T = useT();
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [note, setNote] = useState<string | null>(null);
  const [rate, setRate] = useState(1);
  const index = useRef(0);
  const stopped = useRef(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser capability check after hydration
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      stopped.current = true;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      document.querySelectorAll(".verse-speaking").forEach((e) => e.classList.remove("verse-speaking"));
    };
  }, []);

  if (!supported || verses.length === 0) return null;

  const lang = LANG[language.slice(0, 2)] ?? language;

  function mark(v: number | null) {
    document.querySelectorAll(".verse-speaking").forEach((e) => e.classList.remove("verse-speaking"));
    if (v === null) return;
    const el = document.querySelector(`article.scripture [data-verse="${v}"]`);
    if (el) {
      el.classList.add("verse-speaking");
      const r = el.getBoundingClientRect();
      if (r.top < 80 || r.bottom > window.innerHeight - 120) el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }

  function speakFrom(i: number) {
    const synth = window.speechSynthesis;
    if (stopped.current || i >= verses.length) {
      setState("idle");
      mark(null);
      return;
    }
    index.current = i;
    const u = new SpeechSynthesisUtterance(verses[i].t);
    u.lang = lang;
    u.rate = rate;
    const voice = synth.getVoices().find((vo) => vo.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
    if (voice) u.voice = voice;
    u.onstart = () => mark(verses[i].v);
    u.onend = () => speakFrom(i + 1);
    u.onerror = (e) => {
      if (e.error === "interrupted" || e.error === "canceled") return;
      setNote(T("Your device couldn’t read this aloud.", "Votre appareil n’a pas pu lire ce texte.", "تعذّر على جهازك قراءة النص."));
      setState("idle");
      mark(null);
    };
    synth.speak(u);
  }

  function play() {
    const synth = window.speechSynthesis;
    setNote(null);
    const hasVoice = synth.getVoices().some((vo) => vo.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
    if (synth.getVoices().length > 0 && !hasVoice)
      setNote(
        T(
          "No voice for this language is installed on your device; the default voice will be used.",
          "Aucune voix pour cette langue n’est installée ; la voix par défaut sera utilisée.",
          "لا يوجد صوت لهذه اللغة على جهازك؛ سيُستخدم الصوت الافتراضي.",
        ),
      );
    synth.cancel();
    stopped.current = false;
    setState("playing");
    speakFrom(state === "idle" ? 0 : index.current);
  }

  function pause() {
    window.speechSynthesis.pause();
    setState("paused");
  }
  function resume() {
    window.speechSynthesis.resume();
    setState("playing");
  }
  function stop() {
    stopped.current = true;
    window.speechSynthesis.cancel();
    setState("idle");
    mark(null);
  }

  return (
    <div className="reader-secondary flex flex-wrap items-center gap-1.5">
      {state === "idle" ? (
        <button type="button" className="btn btn-sm" onClick={play}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H3v6h3l5 4V5ZM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
          </svg>
          {T("Listen", "Écouter", "استمع")}
        </button>
      ) : (
        <>
          {state === "playing" ? (
            <button type="button" className="btn btn-sm" onClick={pause}>
              {T("Pause", "Pause", "إيقاف مؤقت")}
            </button>
          ) : (
            <button type="button" className="btn btn-sm btn-primary" onClick={resume}>
              {T("Resume", "Reprendre", "استئناف")}
            </button>
          )}
          <button type="button" className="btn btn-sm btn-ghost" onClick={stop}>
            {T("Stop", "Arrêter", "إيقاف")}
          </button>
          <label className="flex items-center gap-1 text-xs text-muted">
            <span className="sr-only">{T("Speed", "Vitesse", "السرعة")}</span>
            <select className="input h-8 w-auto py-0 text-xs" value={rate} onChange={(e) => setRate(Number(e.target.value))} aria-label={T("Speed", "Vitesse", "السرعة")}>
              {[0.8, 1, 1.2].map((r) => (
                <option key={r} value={r}>
                  {r}×
                </option>
              ))}
            </select>
          </label>
        </>
      )}
      {note && (
        <span role="status" className="w-full text-end text-xs text-muted">
          {note}
        </span>
      )}
    </div>
  );
}
