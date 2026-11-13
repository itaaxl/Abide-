import type { Metadata } from "next";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OfflineList } from "@/components/pwa/OfflineList";

export const metadata: Metadata = { title: "Offline reading", robots: { index: false } };

/**
 * Public page (no account data) — the service worker keeps a copy fetched
 * without cookies and shows it when a page isn't available offline.
 */
export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Offline reading</h1>
      <p className="mt-2 text-muted">
        Chapters you download are stored on this device and open without an internet connection. They contain Bible text only — your highlights,
        notes, and account aren’t included and appear again when you’re back online.
      </p>
      <div className="mt-6">
        <OfflineList />
      </div>
      <h2 className="mt-10 text-lg font-semibold tracking-tight">Needs an internet connection</h2>
      <ul className="mt-2 list-disc space-y-1 ps-5 text-muted">
        <li>Chapters you haven’t downloaded, and search</li>
        <li>Verse cards, Find Guidance, and AI card generation</li>
        <li>Signing in, saving, your Library, journal, and reading plans</li>
      </ul>
      <h2 className="mt-10 text-lg font-semibold tracking-tight">Install Abide</h2>
      <p className="mt-2 text-muted">Add Abide to your home screen to open it like an app.</p>
      <div className="mt-3">
        <InstallPrompt always />
      </div>
    </div>
  );
}
