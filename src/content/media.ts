/**
 * Christian films, series and educational videos (seed content).
 *
 * Policy (docs/MEDIA_POLICY.md):
 *  - Copyrighted films and episodes link to their OFFICIAL viewing
 *    destination. Nothing is hosted, scraped, downloaded, or re-streamed.
 *  - `embed` is only set when the publisher explicitly authorizes embedding
 *    for this use; none are set at launch.
 *  - Descriptions are original text-only summaries; no third-party artwork.
 *  - `lastChecked` records when the link was verified to resolve.
 *  - Inclusion does not imply affiliation with or endorsement by producers.
 */
export type MediaKind = "series" | "movie" | "educational";

export interface MediaEntry {
  slug: string;
  title: string;
  kind: MediaKind;
  description: string;
  provider: string;
  url: string;
  access: "external" | "authorized-embed";
  embedUrl?: string;
  /** Only when a trustworthy rating source exists; otherwise omitted. */
  ageGuidance?: { label: string; source: string };
  dramatized: boolean;
  lastChecked: string;
  i18n?: Partial<Record<"fr" | "ar", { description: string }>>;
}

export const MEDIA: MediaEntry[] = [
  {
    slug: "the-chosen",
    title: "The Chosen",
    kind: "series",
    description:
      "A multi-season drama about the life of Jesus as seen through the people who met him. It is a dramatization: scenes and dialogue go beyond the biblical text, so read the Gospels alongside it.",
    i18n: {
      fr: { description: "Une série en plusieurs saisons sur la vie de Jésus vue par ceux qui l’ont rencontré. C’est une dramatisation : des scènes et dialogues vont au-delà du texte biblique, lisez donc les Évangiles en parallèle." },
      ar: { description: "مسلسل من عدة مواسم عن حياة يسوع كما رآها الذين التقوه. هو عمل درامي: بعض المشاهد والحوارات تتجاوز النص الكتابي، فاقرأ الأناجيل إلى جانبه." },
    },
    provider: "The Chosen (official site)",
    url: "https://watch.thechosen.tv/",
    access: "external",
    dramatized: true,
    lastChecked: "2026-11-08",
  },
  {
    slug: "bibleproject",
    title: "BibleProject",
    kind: "educational",
    description:
      "Short animated overviews of every book of the Bible and of major biblical themes, produced by a non-profit. Useful as an introduction before reading a book.",
    i18n: {
      fr: { description: "De courtes vidéos animées présentant chaque livre de la Bible et ses grands thèmes, produites par une association. Utiles comme introduction avant de lire un livre." },
      ar: { description: "فيديوهات رسوم متحركة قصيرة تعرّف بكل أسفار الكتاب المقدس وموضوعاته الكبرى، من إنتاج منظمة غير ربحية. مفيدة كمقدّمة قبل قراءة سفر." },
    },
    provider: "BibleProject (official site)",
    url: "https://bibleproject.com/",
    access: "external",
    dramatized: false,
    lastChecked: "2026-11-08",
  },
];
