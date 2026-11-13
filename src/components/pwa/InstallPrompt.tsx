"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "abide:install-dismissed";

/**
 * Unobtrusive install option. Uses the browser's install prompt when it is
 * offered; on iPhone/iPad (no prompt) shows the Add to Home Screen steps.
 * Hidden when already installed or dismissed.
 */
export function InstallPrompt({ always = false }: { always?: boolean }) {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    let dismissed = false;
    try {
      dismissed = !always && localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (standalone || dismissed) return;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    /* eslint-disable react-hooks/set-state-in-effect -- browser capability checks after hydration */
    setIos(isIos);
    if (isIos) setHidden(false);
    /* eslint-enable react-hooks/set-state-in-effect */
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    const onInstalled = () => setHidden(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [always]);

  if (hidden) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {evt ? (
        <button
          type="button"
          className="btn btn-sm"
          onClick={async () => {
            await evt.prompt();
            await evt.userChoice;
            setEvt(null);
            setHidden(true);
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
          </svg>
          Install app
        </button>
      ) : ios ? (
        <button type="button" className="btn btn-sm" aria-expanded={showSteps} onClick={() => setShowSteps((s) => !s)}>
          Install app
        </button>
      ) : null}
      {!always && (
        <button type="button" className="btn btn-sm btn-ghost text-muted" onClick={dismiss}>
          Not now
        </button>
      )}
      {showSteps && (
        <p className="w-full text-muted">
          In Safari, tap the <strong>Share</strong> button, then <strong>Add to Home Screen</strong>.
        </p>
      )}
    </div>
  );
}
