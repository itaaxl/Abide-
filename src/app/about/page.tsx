import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <article className="prose-page mx-auto max-w-2xl px-4 py-12">
      <h1>About {site.name}</h1>
      <p>
        {site.name} is a quiet place to read the Bible and grow in it: the complete text in English, French, and Arabic; search; a daily verse;
        memory flashcards; reading plans; a private prayer journal; and optional AI help in finding passages.
      </p>
      <h2>What we believe about the text</h2>
      <p>
        Scripture on this site comes from complete, public-domain editions imported directly from their publisher’s files and checked verse by
        verse. We never change the wording. Reflections, notes, and AI explanations are always labelled and kept separate from Scripture.
      </p>
      <h2>Who we are</h2>
      <p>
        {site.name} is an independent project. It is not affiliated with or endorsed by any church, denomination, Bible publisher, or film
        producer. Operator: {site.operator.name}. Contact: {site.operator.contactEmail}.
      </p>
      <p>
        <Link href="/editions">Bible editions</Link> · <Link href="/credits">Credits</Link> · <Link href="/privacy">Privacy</Link>
      </p>
    </article>
  );
}
