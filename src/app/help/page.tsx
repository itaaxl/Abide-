import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Help" };

const FAQ: [string, React.ReactNode][] = [
  ["How do I look up a verse?", <>Type a reference such as <em>John 3:16</em>, <em>Psalm 23</em>, or <em>1 Cor 13:4-7</em> into the search bar. French and Arabic book names work too (<em>Jean 3:16</em>, <em>يوحنا 3:16</em>).</>],
  ["How do I search for a word or phrase?", <>Type words into the search bar. Use quotation marks for an exact phrase, for example <em>&quot;fear not&quot;</em>. Results come from the translation you’re reading.</>],
  ["What’s the difference between a translation and a book?", <>A <strong>translation</strong> (or edition) is the whole Bible rendered into a language, like the World English Bible. A <strong>book</strong> is one writing inside the Bible, like Genesis or John.</>],
  ["Why do verse numbers sometimes differ between translations?", <>Translations follow different numbering traditions. For example, the Louis Segond counts some longer Psalm titles as their own verse. When numbers might not line up, we show a warning instead of guessing.</>],
  ["How do I save a verse?", <>Sign in, then tap a verse in the reader to bookmark, highlight, add a private note, or make a flashcard.</>],
  ["How do flashcards work?", <>Each card is scheduled with a simple spaced-repetition rule: rate how well you remembered, and the card returns sooner or later. You can always practise without changing the schedule.</>],
  ["Is my journal private?", <>Yes. Journal entries, notes, and saved guidance are visible only to your account, protected by database rules. Journal entries are never sent to AI.</>],
  ["How do I export or delete my data?", <>Go to <Link href="/account">Account settings</Link>. Export downloads a JSON file; deletion removes your account and everything you saved.</>],
  ["Reading settings", <>Use the <strong>Aa</strong> button above any chapter to change theme (light, sepia, dark), text size, line spacing, width, and layout. Focus mode hides everything except the text.</>],
  ["Keyboard shortcuts", <>In flashcards: Space shows the answer, 1–4 rate it. Everywhere: Tab moves between controls; the first Tab offers “Skip to content”.</>],
];

export default function HelpPage() {
  return (
    <article className="prose-page mx-auto max-w-2xl px-4 py-12">
      <h1>Help</h1>
      {FAQ.map(([q, a]) => (
        <section key={q}>
          <h2>{q}</h2>
          <p>{a}</p>
        </section>
      ))}
    </article>
  );
}
