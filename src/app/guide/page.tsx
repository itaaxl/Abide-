import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Beginner’s guide to the Bible" };

export default function GuidePage() {
  return (
    <article className="prose-page mx-auto max-w-2xl px-4 py-12">
      <p className="eyebrow">Editorial guide — not Scripture</p>
      <h1>A beginner’s guide to reading the Bible</h1>
      <h2>A library, not a single book</h2>
      <p>
        The Bible is a collection of writings composed over many centuries. Protestant Bibles contain 66 books: 39 in the Old Testament and 27 in
        the New Testament. Catholic and Orthodox Bibles also include additional books, often called deuterocanonical books or the Apocrypha. The
        World English Bible on this site includes those additional books in a separate, clearly labelled section.
      </p>
      <h2>Books, chapters, and verses</h2>
      <p>
        Each book is divided into chapters, and each chapter into numbered verses. A reference like <strong>John 3:16</strong> means the book of
        John, chapter 3, verse 16. A range like <strong>John 3:16–18</strong> means verses 16 through 18. Chapter and verse numbers were added
        long after the books were written, to help readers find their place.
      </p>
      <h2>Translations</h2>
      <p>
        The Bible was written mainly in Hebrew, Aramaic, and Greek. A translation renders it into another language. Translations differ in wording
        and sometimes in numbering, so it helps to know which one you are reading. See <Link href="/editions">Bible editions</Link>.
      </p>
      <h2>Where to start</h2>
      <ul>
        <li><Link href="/bible/eng-web/JHN/1">The Gospel of John</Link> — the life, teaching, death, and resurrection of Jesus.</li>
        <li><Link href="/bible/eng-web/MRK/1">The Gospel of Mark</Link> — the shortest Gospel, fast-moving and direct.</li>
        <li><Link href="/bible/eng-web/PSA/23">Psalms</Link> — prayers and songs for every season of life.</li>
        <li><Link href="/bible/eng-web/GEN/1">Genesis</Link> — beginnings: creation, Abraham, and his family.</li>
      </ul>
      <h2>How to read</h2>
      <p>
        Read a little at a time. Read whole chapters rather than single verses, so you see the context. Notice who is speaking and to whom. Ask
        questions; many Christians read alongside a church community, and traditions sometimes understand passages differently. A{" "}
        <Link href="/plans">reading plan</Link> can help you keep going.
      </p>
    </article>
  );
}
