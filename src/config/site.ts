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
  /** Public base URL; set NEXT_PUBLIC_SITE_URL in each environment. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** Default edition for new visitors. Must be an imported edition id. */
  defaultEdition: "eng-web",
  /** Where a first-time reader is invited to start. */
  startingPoint: { book: "JHN", chapter: 1 },
  /** Operator details for legal pages — fill these in before launch. */
  operator: {
    name: "[Operator name — to be provided]",
    contactEmail: "[Contact email — to be provided]",
    jurisdiction: "[Governing jurisdiction — to be provided]",
  },
} as const;

export type Site = typeof site;
