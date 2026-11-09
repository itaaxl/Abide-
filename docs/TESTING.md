# Testing record

Environment: Linux container, Node 22.23, Next.js 16.4.5 production build (`next build && next start`), Chromium (Playwright 1.63), PostgreSQL 16 (RLS tests), local Supabase stack via `supabase start` (Postgres 17, GoTrue v2.197, PostgREST, Mailpit) for signed-in flows. Date: 2026-11-08.

## Results

| Suite | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | 0 errors, 0 warnings |
| Types | `npm run typecheck` | clean |
| Unit (full corpus) | `npm test` | **46 / 46 pass** — reference parsing (EN/FR/AR, numbered books, ranges, bounds), search (phrases, filters, pagination, accents/diacritics), dataset integrity, scheduler (initial, repeated failures, growth, caps, DST, timezone change), guidance workflow (ordinary, invalid ids, malformed, provider failure, refusal, quota, unconfigured, crisis, prompt injection), content references, safe redirects |
| Database / RLS | `npm run test:db` | **34 / 34 assertions pass** — two users; cross-user read/update/delete/insert blocked; guessed ids; deck ownership trigger; `record_review` idempotency and stale-version conflict; role escalation blocked; drafts hidden; privileged functions not callable; deletion cascade; rate limit and quota functions |
| Migration on real Supabase | `supabase start` | migration applied cleanly to Supabase Postgres 17 |
| Guest e2e | `npm run test:e2e` | **39 / 39 pass** — home reader/search/browser, five-tab bottom bar fits an iPhone SE without scrolling, tab press shows the next page in <400 ms (prefetched loading state), focus mode (hides chrome, keeps the verse in place, Android/browser Back exits focus not the chapter, Escape), Library links to Journal/Discover/Watch, old /daily links redirect to /flashcards, verse cards (today first, prev/next, keyboard, touch swipe, selectable text), bottom navigation (all 8 sections, active state, never covers content on iPhone SE), Arabic RTL verse card, reference redirect, keyword search + filters, bounds messages, 404, canonical next-chapter across books, verse actions, share-page metadata, parallel-reading warning, RTL, home/daily agreement, plans, Watch link, private-page noindex + gates, security headers + CSP nonce, health endpoint, skip link, axe on 9 pages, contrast in sepia/dark, no overflow on phone/landscape/tablet/wide, zero CSP violations |
| Signed-in e2e | `npm run test:e2e:accounts` | **29 / 29 pass** — see below (includes saving a verse card to the Saved tab) |
| Dependency audit | `npm audit --omit=dev` | 0 vulnerabilities in production dependencies (dev-only: moderate advisories in the `typescript-eslint` chain used by `eslint-config-next`; not shipped) |

### Signed-in flows verified against local Supabase + Mailpit
Sign-up field validation and live password rules; show-password; check-your-email state; unverified sign-in refused with resend; resend cooldown; **real verification email link → signed in**; invalid/expired link page; bookmark + highlight + note persist after reload and appear in My Library (searchable); flashcard creation, duplicate prevention, due-today queue, review with rapid double key-press producing exactly one review row; plan start / mark complete / persist / pause / resume; journal create + search; guidance without AI key → honest curated fallback; JSON export contents and `no-store`; sign-out; **second user cannot open the first user’s journal entry by URL (404), sees none of their notes, and their export excludes them**; non-admin blocked from /admin, admin granted only via SQL; **password reset via one-time email link** then sign-in with new password (old one rejected); cleared cookies → signed out; account deletion requires correct password and removes the auth user; axe A/AA on 9 signed-in pages.

## Failures found and fixed during testing
- Resending verification within 60 s of sign-up rotated the token without sending a new email (auth server email frequency limit), invalidating the original link. Fix: resend is blocked for 60 s after sign-up (server and UI), and rate-limit errors are reported honestly.
- `aria-allowed-attr`: verse text spans had `aria-pressed`; moved selection state to the verse-number button.
- Flashcard card surface was a `role=button` containing a link (nested interactive); now a plain click target with `inert` on the hidden face.
- Out-of-range chapters returned 200 because a root loading boundary started streaming; removed it so `notFound()` returns 404.
- Dev-mode CSP blocked Next’s injected styles; development now allows inline styles, production uses nonces (verified with zero violations).
- Home page hero text was untranslated in French/Arabic UI; localized.
- Guidance candidates could have shown offset Psalm verses in LSG; only candidates with identical numbering are used.

## Not verified (requires real services)
- Delivery through a production SMTP provider (Mailpit only captures mail locally).
- Google sign-in (provider not configured).
- AI responses from Anthropic (no API key in this environment). The full pipeline is tested with a mocked provider; the real adapter (`src/lib/guidance/anthropic.ts`) compiles against SDK 1.6.0 types but has not made a live call.
- Vercel deployment, custom domain, and auth redirects on the deployed domain.
- Manual screen-reader testing.

## Authentication email update (2026-11-08)
| Suite | Where | Result |
| --- | --- | --- |
| `npm run test:e2e:email` | local Supabase + Mailpit, codes on | **12 / 12** — branded verification email (code + button, expiry, ignore text), wrong code rejected, verify by code, session persistence, code sign-in (default method, 8-digit input), used button rejected, fresh button signs in, attempt limit, neutral unknown-email message, password sign-in, recovery by code |
| `npm run test:e2e:accounts` | local, codes on and off | **28 / 28** both |
| `tests/e2e/live-auth.mjs` | **live** https://abide-omega.vercel.app with real Supabase tokens (admin-generated, no mailbox) | **8 / 8** — Supabase verify links redirect to the live site (not localhost), verification signs in, session persists, bookmark + note persist, used link rejected, recovery → new password → password sign-in, honest error when the email can't be sent, no page opened localhost |

Not yet tested live: actual email delivery through Resend and code entry in production (blocked on a verified sending domain; codes are off in production until then). Resend delivery logs: no emails sent yet.

## Live email delivery (2026-11-09, https://abide-omega.vercel.app, Resend SMTP)
Real emails sent by Supabase through Resend (`Abide <no-reply@axly.org>`) to Resend's `delivered@resend.dev` test address; codes read from Resend's sent-email log and entered on the live site:
- Registration via the live form → "Confirm your Abide account" **delivered** → 8-digit code verified the account → signed in; session persisted across reload; bookmark saved.
- Code sign-in → "Your Abide sign-in code" **delivered** → code signed in; second send blocked by the 60 s cooldown; bookmark still present.
- The same email's button afterwards → rejected as used (single-use) → recovery page.
- Password reset → "Reset your Abide password" **delivered** → button opened in a fresh browser (no cookies) → new password set → old password rejected, new password signs in.
- Every email: Abide branding, code, 15-minute expiry, ignore notice; all links on https://abide-omega.vercel.app; no page opened localhost.

## Incident: no email for an existing verified account (2026-11-09)
- Supabase Auth logs: `POST /signup` (action `user_repeated_signup`) then `POST /resend`, both HTTP 200. Resend logs: nothing sent to that address; no suppressions.
- Cause: Supabase deliberately sends nothing when an already-verified address signs up again or requests a verification resend, while the site said an email was on its way.
- Fix (commit 48c409a): a service-role-only lookup (`auth_email_status`) makes sign-up and "resend" send a Supabase sign-in code to verified accounts; the page text is the same for new and existing addresses. Migration applied in production by the build.
- Verified: local email suite 14/14 (two new regression checks); live, a verified test account using sign-up received "Your Abide sign-in code" (Resend: delivered) and landed on the code page. Test account deleted; the owner's account was not modified.
