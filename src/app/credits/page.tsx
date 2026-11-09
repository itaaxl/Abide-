import type { Metadata } from "next";

export const metadata: Metadata = { title: "Credits" };

export default function CreditsPage() {
  return (
    <article className="prose-page mx-auto max-w-2xl px-4 py-12">
      <h1>Credits</h1>
      <h2>Scripture</h2>
      <ul>
        <li>World English Bible (WEB) — public domain. “World English Bible” is a trademark of eBible.org, used for the unaltered text. <a href="https://ebible.org/web/">ebible.org/web</a></li>
        <li>Louis Segond 1910 (LSG) — public domain, via <a href="https://ebible.org/fraLSG/">eBible.org</a>.</li>
        <li>Smith &amp; Van Dyck Arabic Bible — public domain, via <a href="https://ebible.org/arb-vd/">eBible.org</a>.</li>
      </ul>
      <h2>Fonts</h2>
      <ul>
        <li>Newsreader — SIL Open Font License 1.1 (served from this site via the Fontsource package).</li>
        <li>Plus Jakarta Sans — SIL Open Font License 1.1.</li>
        <li>Noto Naskh Arabic and IBM Plex Sans Arabic — SIL Open Font License 1.1.</li>
      </ul>
      <h2>Artwork</h2>
      <p>The logo (an open book with a cross) and all interface graphics are original to this site. We do not use third-party film artwork.</p>
      <h2>Editorial content</h2>
      <p>Daily reflections, topic notes, reading plans, and the beginner’s guide are original editorial text written for this site. They are not Scripture.</p>
      <h2>Software</h2>
      <p>Built with Next.js, React, Tailwind CSS, Supabase, and the Anthropic SDK, each under its own open-source licence.</p>
    </article>
  );
}
