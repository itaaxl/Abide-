/**
 * Deterministic spaced-repetition scheduler (a simplified SM-2 variant).
 * Review dates are computed here, never by an AI model.
 *
 * Rules (also in docs/FLASHCARDS.md):
 *  - Again: lapse. reps -> 0, ease -0.20, card returns in 10 minutes (same study day).
 *  - Hard:  interval = max(1, round(prev × 1.2)), ease -0.15.
 *  - Good:  1st success 1 day, 2nd 3 days, then round(prev × ease).
 *  - Easy:  1st success 4 days, then round(prev × ease × 1.3), ease +0.15.
 *  - Good/Easy always grow by at least one day; intervals cap at 365 days.
 *  - Ease stays within [1.3, 3.0].
 *  - Day intervals are due at the start of the user's local day, so a card
 *    due "in 3 days" appears in the queue that morning in their timezone.
 */
import { addDays, localDate, startOfLocalDay } from "./time";

export const RATINGS = ["again", "hard", "good", "easy"] as const;
export type Rating = (typeof RATINGS)[number];

export interface CardState {
  intervalDays: number;
  ease: number;
  reps: number;
  lapses: number;
}

export const NEW_CARD: CardState = { intervalDays: 0, ease: 2.5, reps: 0, lapses: 0 };
export const MAX_INTERVAL = 365;
export const RELEARN_MINUTES = 10;

const clampEase = (e: number) => Math.round(Math.min(3, Math.max(1.3, e)) * 100) / 100;

export function schedule(state: CardState, rating: Rating, now: Date, timezone: string): CardState & { dueAt: Date } {
  const prev = state.intervalDays;
  let { ease, reps, lapses } = state;
  let interval: number;

  switch (rating) {
    case "again":
      lapses += 1;
      reps = 0;
      ease = clampEase(ease - 0.2);
      return { intervalDays: 0, ease, reps, lapses, dueAt: new Date(now.getTime() + RELEARN_MINUTES * 60000) };
    case "hard":
      interval = Math.max(1, Math.round(prev * 1.2));
      ease = clampEase(ease - 0.15);
      reps += 1;
      break;
    case "good":
      interval = reps === 0 ? 1 : reps === 1 ? 3 : Math.max(prev + 1, Math.round(prev * ease));
      reps += 1;
      break;
    case "easy":
      interval = reps === 0 ? 4 : Math.max(prev + 1, Math.round(prev * ease * 1.3));
      ease = clampEase(ease + 0.15);
      reps += 1;
      break;
  }
  interval = Math.min(MAX_INTERVAL, interval);
  const dueDate = addDays(localDate(now, timezone), interval);
  return { intervalDays: interval, ease, reps, lapses, dueAt: startOfLocalDay(dueDate, timezone) };
}

/** Human description of the next interval for button hints. */
export function describeInterval(state: CardState & { dueAt: Date }, now: Date): string {
  if (state.intervalDays === 0) return `${Math.round((state.dueAt.getTime() - now.getTime()) / 60000)} min`;
  return state.intervalDays === 1 ? "1 day" : `${state.intervalDays} days`;
}
