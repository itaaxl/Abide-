# Flashcards: scheduling and correctness

Implemented in `src/lib/srs.ts` (tested in `tests/srs.test.ts`). Review dates are computed deterministically on the server — never by AI.

| Rating | Effect |
| --- | --- |
| Again | Lapse: repetitions reset to 0, ease −0.20, card returns in 10 minutes (same session) |
| Hard | interval = max(1, round(previous × 1.2)), ease −0.15 |
| Good | 1st success: 1 day; 2nd: 3 days; then round(previous × ease), always ≥ previous + 1 |
| Easy | 1st success: 4 days; then round(previous × ease × 1.3), ease +0.15 |

Ease is kept within 1.3–3.0; intervals cap at 365 days. Day intervals are due at the start of the user’s local day.

**Timezones.** Due times are absolute instants. The “due today” queue includes everything due before the end of the user’s current local day, so a timezone change can make a card appear a few hours earlier or later but never loses it.

**Duplicate submissions.** Each answer carries a client-generated `requestId`; `reviews.request_id` is unique and `record_review()` returns `duplicate` for a repeat, so double taps and network retries record once.

**Concurrency across devices.** Each card has a `version`. `record_review()` locks the row and rejects stale versions with `conflict`; the client then moves on without overwriting the newer review.

**Failed saves.** If saving fails, the card stays at the front of the queue with the same `requestId`, so retrying is safe.

**Practice mode** shows cards without changing schedules. **Reset progress** (per deck, with confirmation) clears scheduling and that deck’s review history.

**Translations.** Each card stores the edition it was created in and always renders that edition’s text. “Copy to translation” explicitly creates an additional card, only when the passage exists with the same numbering in the target edition.

Statistics shown are activity counts (cards, passages practised, reviews); the app makes no claims about memory retention.
