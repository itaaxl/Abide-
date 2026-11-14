/**
 * Brand and product configuration. Rename the site by editing this file only.
 * "Abide" is a working name: its trademark and domain availability have NOT
 * been verified.
 */
export const site = {
  name: "Abide",
  tagline: "Read Scripture. Remember it. Grow in it.",
  description:
    "A calm place to read the complete Bible, search Scripture, memorize verses, follow reading plans, and keep a private prayer journal.",
  /**
   * Public base URL (used in auth email links, sitemaps and share metadata).
   * NEXT_PUBLIC_SITE_URL wins; on Vercel it falls back to the project's
   * production domain, which Vercel provides automatically.
   */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    "http://localhost:3000",
  /** Default edition for new visitors. Must be an imported edition id. */
  defaultEdition: "eng-web",
  /** Where a first-time reader is invited to start. */
  startingPoint: { book: "JHN", chapter: 1 },
  /** Operator details for legal pages (an individual, not a registered company). */
  operator: {
    name: "Axl Gedeon",
    contactEmail: "axl@gedeon.org",
    location: "Lebanon",
  },
} as const;

export type Site = typeof site;
