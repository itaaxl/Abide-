import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { aiConfig } from "@/lib/guidance/config";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  const cfg = aiConfig();
  return (
    <article className="prose-page mx-auto max-w-2xl px-4 py-12">
      <h1>Privacy policy</h1>
      <p className="rounded-lg border border-rule bg-gold-soft/30 p-3 text-sm">
        Draft — the operator details below must be completed and this policy reviewed by the operator (and legal counsel where appropriate) before
        launch. It describes how the software actually behaves.
      </p>
      <p>Operator: {site.operator.name} · Contact: {site.operator.contactEmail} · Jurisdiction: {site.operator.jurisdiction}</p>

      <h2>Without an account</h2>
      <p>
        You can read, search, view the daily verse, browse reading plans, and see the Watch page without an account. We store reading preferences
        (theme, text size, translation, interface language, timezone) in a first-party cookie on your device, and your last reading position in your
        browser’s local storage. We do not use advertising or third-party analytics.
      </p>

      <h2>With an account</h2>
      <p>We store only what the features need:</p>
      <ul>
        <li>Your email address and a password managed by our authentication provider (Supabase). We never see your password.</li>
        <li>An optional display name, your preferences, timezone, and daily flashcard goal.</li>
        <li>Things you choose to save: bookmarks and tags, highlights, notes, flashcards and review history, reading-plan progress, reading history, prayer journal entries, saved guidance, and your watchlist.</li>
        <li>Daily counts of AI requests and token usage (numbers only, no text) to enforce limits.</li>
      </ul>
      <p>We do not ask for your birthdate, address, phone number, or demographic information.</p>
      <p>
        Your saved records are private: database rules ensure each record can only be read or changed by its owner. Administrators manage published
        content (daily verses, plans, topics, media links) and can see aggregate usage numbers, but the admin area does not show anyone’s journal,
        notes, or guidance requests.
      </p>

      <h2>Find Guidance (AI)</h2>
      <ul>
        <li>When you use Find Guidance or Generate cards, the words you type (your request, topic, chapter, or goal) and a short list of candidate Bible passages are sent to our AI provider, Groq (servers in the United States), to choose passages and write short explanations or reflections.</li>
        <li>Your request is not stored by us unless you press “Save this guidance”. It is never written to our logs or analytics.</li>
        <li>Groq states that it does not retain inference requests by default, but may temporarily log them for up to 30 days to investigate abuse unless Zero Data Retention is turned on. We use Groq’s free plan; please don’t include names or other sensitive details in your request.</li>
        <li>For generated cards we keep only the chosen passage references and short reflections so repeat requests can reuse them; the words of a personal goal are not stored (only a one-way fingerprint tied to your account).</li>
        <li>Journal entries, notes, and other saved content are never sent to the AI provider.</li>
        <li>Limit: {cfg.dailyLimit} requests per person per day.</li>
      </ul>

      <h2>Sharing</h2>
      <p>Share links show Scripture only — never your notes, journal, guidance requests, or account details.</p>

      <h2>Your choices</h2>
      <ul>
        <li><Link href="/account">Export</Link> all your data as a JSON file at any time.</li>
        <li><Link href="/account">Delete your account</Link>; this permanently removes your account and every record linked to it. If self-service deletion is unavailable, contact the operator, who will delete the authentication user in the Supabase dashboard, which cascades to all application records.</li>
      </ul>

      <h2>Service providers</h2>
      <ul>
        <li>Hosting: Vercel (when deployed there).</li>
        <li>Database and authentication: Supabase.</li>
        <li>AI suggestions: Groq (only for Find Guidance and Generate cards requests).</li>
        <li>Email delivery for verification and password reset: the email provider configured in Supabase.</li>
      </ul>
      <h2>Changes</h2>
      <p>We will update this page if the way the site handles data changes.</p>
    </article>
  );
}
