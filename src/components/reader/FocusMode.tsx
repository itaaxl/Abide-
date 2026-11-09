"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const FOCUS_KEY = "abideFocus";

/** First verse visible below the top of the viewport, and its offset. */
function readingAnchor(): { el: Element; top: number } | null {
  const verses = document.querySelectorAll("article.scripture [data-verse]");
  for (const el of verses) {
    const r = el.getBoundingClientRect();
    if (r.bottom > 64) return { el, top: r.top };
  }
  return null;
}

/**
 * Distraction-free reading. Hides the header, bottom navigation, footer,
 * toolbar and secondary controls (via html[data-focus], see globals.css),
 * leaving the Scripture text and its book/chapter heading. The verse at the
 * top of the screen stays in place when entering or leaving. Font size and
 * theme are untouched (they are page-wide preferences).
 *
 * Back button (Android/browser): entering adds a history entry for the same
 * URL, so Back leaves focus mode instead of leaving the reader.
 */
export function FocusMode({ label, exitLabel }: { label: string; exitLabel: string }) {
  const [on, setOn] = useState(false);
  const anchor = useRef<{ el: Element; top: number } | null>(null);
  const enterButton = useRef<HTMLButtonElement>(null);
  const exitButton = useRef<HTMLButtonElement>(null);
  const wasOn = useRef(false);
  const lastAnchor = useRef<{ el: Element; top: number } | null>(null);
  const prevRestoration = useRef<ScrollRestoration>("auto");

  const enter = useCallback(() => {
    anchor.current = readingAnchor();
    // While in focus mode we manage the scroll position ourselves; the
    // browser must not jump back to where the history entry was created.
    prevRestoration.current = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.history.pushState({ ...window.history.state, [FOCUS_KEY]: true }, "");
    setOn(true);
  }, []);

  const exit = useCallback(() => {
    anchor.current = readingAnchor();
    lastAnchor.current = anchor.current;
    // Pop our own history entry when it is the current one; popstate then
    // turns focus mode off. Otherwise just turn it off.
    if (window.history.state?.[FOCUS_KEY]) window.history.back();
    else setOn(false);
  }, []);

  // Remember where the reader is while in focus mode, so leaving (by any
  // route, including Back) returns to the same verse.
  useEffect(() => {
    if (!on) return;
    let frame = 0;
    function track() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        lastAnchor.current = readingAnchor();
      });
    }
    track();
    window.addEventListener("scroll", track, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", track);
    };
  }, [on]);

  // Back button / gesture leaves focus mode.
  useEffect(() => {
    function onPop() {
      if (!window.history.state?.[FOCUS_KEY]) {
        anchor.current = lastAnchor.current ?? anchor.current ?? readingAnchor();
        setOn(false);
      }
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Escape leaves focus mode.
  useEffect(() => {
    if (!on) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") exit();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [on, exit]);

  // Apply before paint and keep the same verse at the same screen position.
  useLayoutEffect(() => {
    document.documentElement.toggleAttribute("data-focus", on);
    const a = anchor.current;
    anchor.current = null;
    if (a) window.scrollBy({ top: a.el.getBoundingClientRect().top - a.top, behavior: "instant" });
    if (on) exitButton.current?.focus({ preventScroll: true });
    else if (wasOn.current) {
      enterButton.current?.focus({ preventScroll: true });
      window.history.scrollRestoration = prevRestoration.current;
    }
    wasOn.current = on;
  }, [on]);

  // Leaving the page (e.g. a link in the text) always restores the chrome.
  useEffect(() => () => document.documentElement.removeAttribute("data-focus"), []);

  return (
    <>
      <button ref={enterButton} type="button" className="btn btn-sm reader-secondary" onClick={enter}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
        </svg>
        {label}
      </button>
      {on && (
        <button
          ref={exitButton}
          type="button"
          onClick={exit}
          className="focus-exit btn btn-sm fixed end-3 z-50 bg-surface/90 shadow-sm backdrop-blur"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
          {exitLabel}
        </button>
      )}
    </>
  );
}
