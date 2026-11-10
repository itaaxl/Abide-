import { z } from "zod";

/** Strict structured output requested from the model. */
export const guidanceOutputSchema = z.object({
  needs_clarification: z
    .boolean()
    .describe("True when the request is too vague or unclear to choose fitting passages, or none of the candidates genuinely fit it."),
  clarifying_question: z
    .string()
    .describe("When needs_clarification is true: one short, kind question asking what the person means or is going through. Otherwise an empty string."),
  opening: z.string().describe("One or two gentle sentences acknowledging the request. No claims to speak for God."),
  passages: z
    .array(
      z.object({
        id: z.string().describe("A candidate id exactly as given, e.g. P3"),
        connection: z.string().describe("2-4 sentences on why this passage may speak to the request, noting context where relevant."),
      }),
    )
    .describe("Between 2 and 4 passages chosen ONLY from the candidate list (empty when needs_clarification is true)."),
  practical_steps: z.array(z.string()).describe("Up to 3 small, concrete, optional actions."),
  prayer: z.string().describe("A short optional prayer the person may use, in first person, or an empty string."),
  suggest_human_support: z.boolean().describe("True if talking with a trusted person, pastor, or professional would clearly help."),
});

export type GuidanceOutput = z.infer<typeof guidanceOutputSchema>;

/** What the UI receives after server-side validation. Scripture comes from the dataset. */
export interface GuidanceResult {
  kind: "ai" | "fallback" | "crisis" | "clarify";
  /** Why a fallback was used (shown honestly to the user). */
  fallbackReason?: "unconfigured" | "quota" | "provider-error" | "refusal" | "malformed" | "no-matches";
  opening?: string;
  passages: {
    key: string;
    label: string;
    edition: string;
    editionAbbr: string;
    direction: "ltr" | "rtl";
    text: string;
    connection: string;
    href: string;
    chapterHref: string;
    book: string;
    chapter: number;
    verseStart: number;
    verseEnd: number;
  }[];
  practicalSteps: string[];
  prayer?: string;
  suggestHumanSupport: boolean;
  remainingToday?: number;
  model?: string;
}
