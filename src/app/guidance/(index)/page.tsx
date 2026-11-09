import type { Metadata } from "next";
import Link from "next/link";
import { GuidanceForm } from "@/components/guidance/GuidanceForm";
import { getSessionUser } from "@/lib/auth";
import { aiConfig } from "@/lib/guidance/config";
import { getPrefs } from "@/lib/request";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Find Guidance", robots: { index: true } };

export default async function GuidancePage() {
  const [user, prefs] = await Promise.all([getSessionUser(), getPrefs()]);
  const cfg = aiConfig();
  const canUse = Boolean(user?.emailVerified);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Find Guidance</h1>
      <p className="mt-3 leading-relaxed text-muted">
        Describe what you’re struggling with, hoping for, or trying to grow in. We’ll suggest a few Bible passages and briefly explain why each may be relevant — with links to read the full chapter for context. This is a reading aid, not a pastor, counselor, or doctor.
      </p>
      <details className="mt-4 text-sm text-muted">
        <summary className="cursor-pointer">How this works and what is shared</summary>
        <ul className="mt-2 list-disc space-y-1 ps-6">
          <li>First we search our verified Bible text and curated topic lists for candidate passages.</li>
          <li>If AI is available, your words and those candidates are sent to our AI provider (Anthropic), which chooses among them and writes short explanations. It cannot add other references.</li>
          <li>Verse text is always shown from our verified edition, never from AI wording.</li>
          <li>Your request is not stored unless you choose “Save”. It is never added to analytics or logs.</li>
          <li>If AI is unavailable, you’ll see passages from curated topic lists instead, clearly labelled.</li>
          <li>Limit: {cfg.dailyLimit} AI requests per person per day.</li>
        </ul>
      </details>
      {!isSupabaseConfigured() ? (
        <p className="card mt-6 p-4 text-sm">Personalized guidance needs accounts, which aren’t configured on this deployment yet. You can browse curated passages by topic on the <Link href="/discover" className="underline">Discover</Link> page.</p>
      ) : !canUse ? (
        <p className="card mt-6 p-4 text-sm">
          Personalized guidance is available to signed-in members with a verified email, so we can enforce fair daily limits. Without an account, explore curated passages on <Link href="/discover" className="underline">Discover</Link>.
        </p>
      ) : null}
      <div className="mt-6">
        <GuidanceForm edition={prefs.edition} maxChars={cfg.maxInputChars} canUse={canUse} signInHref="/auth/sign-in?next=/guidance" />
      </div>
      {canUse && (
        <p className="mt-8 text-sm">
          <Link href="/guidance/saved" className="underline">Your saved guidance</Link>
        </p>
      )}
    </div>
  );
}
