/**
 * Reading plans (seed content). Every day lists real passages in World
 * English Bible numbering; tests/content.test.ts validates each one against
 * the installed editions and reports books missing from an edition.
 */
export interface ReadingPlan {
  slug: string;
  title: string;
  summary: string;
  description: string;
  minutesPerDay: number;
  days: { refs: string[] }[];
}

const chapters = (book: string, from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => ({ refs: [`${book}.${from + i}`] }));

export const PLANS: ReadingPlan[] = [
  {
    slug: "gospel-of-john",
    title: "Meet Jesus in the Gospel of John",
    summary: "21 days · one chapter a day",
    description:
      "John wrote his Gospel ‘that you may believe that Jesus is the Christ, the Son of God’ (John 20:31). Read one chapter a day to walk through Jesus’ signs, conversations, death, and resurrection. A good first plan for anyone new to the Bible.",
    minutesPerDay: 6,
    days: chapters("JHN", 1, 21),
  },
  {
    slug: "psalms-for-prayer",
    title: "Psalms for Prayer",
    summary: "30 days · one psalm a day",
    description:
      "The Psalms are the prayer book of the Bible, full of praise, lament, trust, and honest questions. Read one psalm a day and use its words as a starting point for your own prayer.",
    minutesPerDay: 4,
    days: [1, 4, 8, 13, 16, 19, 23, 25, 27, 30, 32, 34, 40, 42, 46, 51, 62, 63, 84, 90, 91, 100, 103, 116, 121, 130, 139, 145, 146, 150].map(
      (n) => ({ refs: [`PSA.${n}`] }),
    ),
  },
  {
    slug: "new-testament-start",
    title: "Starting the New Testament",
    summary: "30 days · about one chapter a day",
    description:
      "Begin with the fast-moving Gospel of Mark, see the early church begin in Acts, then read key chapters from the letters about grace, love, and hope.",
    minutesPerDay: 7,
    days: [
      ...chapters("MRK", 1, 16),
      { refs: ["ACT.1"] },
      { refs: ["ACT.2"] },
      { refs: ["ROM.5"] },
      { refs: ["ROM.8"] },
      { refs: ["ROM.12"] },
      { refs: ["1CO.13"] },
      { refs: ["1CO.15"] },
      { refs: ["GAL.5"] },
      { refs: ["EPH.2"] },
      { refs: ["PHP.2"] },
      { refs: ["PHP.4"] },
      { refs: ["JAS.1"] },
      { refs: ["1JN.4"] },
      { refs: ["REV.21"] },
    ],
  },
  {
    slug: "sermon-on-the-mount",
    title: "The Sermon on the Mount",
    summary: "7 days · short daily readings",
    description: "Read Jesus’ best-known teaching slowly over one week, a few paragraphs at a time.",
    minutesPerDay: 4,
    days: [
      { refs: ["MAT.5.1-16"] },
      { refs: ["MAT.5.17-48"] },
      { refs: ["MAT.6.1-18"] },
      { refs: ["MAT.6.19-34"] },
      { refs: ["MAT.7.1-14"] },
      { refs: ["MAT.7.15-29"] },
      { refs: ["LUK.6.27-49"] },
    ],
  },
];
