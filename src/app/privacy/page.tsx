import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { aiConfig } from "@/lib/guidance/config";

export const metadata: Metadata = { title: "Privacy policy" };

/** True while any operator detail is still a placeholder. */
const operatorIncomplete = Object.values(site.operator).some((v) => v.startsWith("["));

export default function PrivacyPage() {
  const cfg = aiConfig();
  return (
    <article className="prose-page mx-auto max-w-2xl px-4 py-12">
      <h1>Privacy policy</h1>
      {operatorIncomplete && (
        <p className="rounded-lg border border-rule bg-gold-soft/30 p-3 text-sm">
          Draft — the operator’s name, contact email, and jurisdiction have not been provided yet. This page describes how the site actually
          behaves, but it is not final until those details are added and the operator has reviewed it.
        </p>
      )}
      <p>
        {site.name} is operated by {site.operator.name}. Contact: {site.operator.contactEmail}. Jurisdiction: {site.operator.jurisdiction}.
      </p>

      <h2>Without an account</h2>
      <p>
        You can read and search the Bible, swipe through verse cards, browse reading plans and themes, and see curated passages in Find Guidance
        without an account. We do not use advertising, tracking pixels, or third-party analytics.
      </p>
      <p>On your own device we keep:</p>
      <ul>
        <li>A first-party cookie with your reading preferences (theme, text size, translation, interface language, timezone).</li>
        <li>Your last chapter, in your browser’s local storage, so the Bible tab can reopen it.</li>
        <li>Chapters you choose to download for offline reading, and the files needed to open the site offline, in your browser’s storage. These contain public Bible text only. You can remove them at any time from the Offline section of the Bible reader.</li>
        <li>If you start typing a Find Guidance request and then sign in, that text is kept temporarily in this browser tab’s session storage so it can be restored; it is cleared when you send or discard it, when you close the tab, or if a different account signs in.</li>
      </ul>
      <p>Verse images you download are created entirely on your device and contain only the Scripture text, reference, translation, the site name, and (if present) a clearly labelled reflection.</p>

      <h2>With an account</h2>
      <p>We store only what the features need:</p>
      <ul>
        <li>Your email address and, if you set one, a password managed by our authentication provider (Supabase). We never see your password. You can also sign in with one-time email codes.</li>
        <li>An optional display name, your preferences, timezone, and daily flashcard goal.</li>
        <li>Things you choose to save: bookmarks and tags, highlights, notes, saved flashcards and review history, reading-plan progress, reading position, prayer journal entries, saved guidance, and your watch list.</li>
        <li>Daily counts of AI requests and token usage (numbers only, no text) to enforce limits.</li>
      </ul>
      <p>We do not ask for your birthdate, address, phone number, or demographic information.</p>
      <p>
        Your saved records are private: database rules ensure each record can only be read or changed by its owner. Administrators manage published
        content (verse cards, plans, themes, media links) and can see aggregate usage numbers, but the admin area does not show anyone’s journal,
        notes, saved cards, or guidance requests. Pages showing your private data are never stored by the site’s offline cache.
      </p>

      <h2>AI features (Find Guidance and Generate cards)</h2>
      <ul>
        <li>These need an account and an internet connection. When you use them, the words you type (your request, or the topic, chapter, or goal you choose) and a short list of candidate Bible passages are sent to our AI provider, Groq, which processes them in the United States.</li>
        <li>The AI only chooses among passages taken from the site’s own Bible text and writes short explanations or reflections. Scripture is always shown from the site’s data, and AI-written text is labelled.</li>
        <li>We do not store your request unless you press “Save this guidance”. Requests are never written to our logs or analytics.</li>
        <li>For generated cards we keep only the chosen passage references and short reflections, so repeat requests can reuse them. The words of a personal goal are not stored — only a one-way fingerprint tied to your account. Generated cards are saved to your account only when you press Save.</li>
        <li>Groq states that it does not retain inference requests by default, but may log them for up to 30 days to investigate abuse unless its Zero Data Retention setting is turned on. We use Groq’s free plan. Please don’t include names or other sensitive details.</li>
        <li>Journal entries, notes, and other saved content are never sent to the AI provider.</li>
        <li>Limit: {cfg.dailyLimit} AI requests per person per day, plus a shared limit for the whole site. When a limit is reached, curated passages chosen by people are shown instead.</li>
      </ul>

      <h2>Emails</h2>
      <p>Sign-in codes, verification, and password-reset emails are sent through Resend on behalf of our authentication provider. We do not send marketing email.</p>

      <h2>Sharing</h2>
      <p>Share links and downloaded verse images show Scripture only — never your notes, journal, guidance requests, or account details.</p>

      <h2>Watch</h2>
      <p>The Watch list (in Library) links to official external sites. We don’t embed tracking from them; when you follow a link, that site’s own privacy policy applies.</p>

      <h2>Your choices</h2>
      <ul>
        <li><Link href="/account">Export</Link> all your data as a JSON file at any time.</li>
        <li><Link href="/account">Delete your account</Link>; this permanently removes your account and every record linked to it.</li>
        <li>Clear offline downloads in the Bible reader’s Offline section, or clear this site’s data in your browser settings.</li>
      </ul>

      <h2>Service providers</h2>
      <ul>
        <li>Hosting: Vercel, which keeps standard technical request logs (such as IP address and time) for security and operations.</li>
        <li>Database and authentication: Supabase (United States region).</li>
        <li>Email delivery: Resend.</li>
        <li>AI suggestions: Groq (only for Find Guidance and Generate cards).</li>
      </ul>
      <p>Rate limits use one-way fingerprints of identifiers rather than storing raw email or IP addresses.</p>

      <h2>Changes</h2>
      <p>We will update this page if the way the site handles data changes.</p>
    </article>
  );
}
