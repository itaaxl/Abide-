# Requirements checklist (240)

Legend: **T** implemented and tested · **I** implemented, not separately tested · **P** partial · **B** blocked on credentials/accounts · **D** deferred. Tests are listed in [TESTING.md](TESTING.md).

## Project goal and working instructions (1–10)
| # | Status | Notes |
|---|---|---|
| 1 | T | Complete Bible + growth features; no personal name in branding |
| 2 | I | Separate codebase/repo; no Axl Studio assets |
| 3 | I | Name in `src/config/site.ts`; availability not claimed |
| 4 | T | Working features across all milestones |
| 5 | I | Empty repo inspected; Next 16 bundled docs read before coding |
| 6 | I | This file |
| 7 | I | No credentials requested; reversible defaults chosen |
| 8 | I | Built in the requested slice order |
| 9 | I | [PROGRESS.md](PROGRESS.md) |
| 10 | I | Claims limited to evidence; blockers listed in README |

## Technical foundation (11–20)
| # | Status | Notes |
|---|---|---|
| 11 | T | Next.js 16.4.5 + TypeScript via official create-next-app; v16 docs consulted |
| 12 | I | Tailwind 4 + one in-house component set |
| 13 | T | Supabase; migration + RLS; applied to real Supabase Postgres 17 |
| 14 | I | Server-side Anthropic SDK; `AI_MODEL` configurable (default `claude-opus-5-5`) |
| 15 | T | `BibleProvider` interface |
| 16 | I | See README layout |
| 17 | I | package-lock + scripts for dev/build/lint/typecheck/db/import/tests |
| 18 | I | `.env.example` with public vs server-only sections |
| 19 | T | Reader works with no env; honest unconfigured states (e2e) |
| 20 | I | Pushed buildable commits per milestone |

## Visual identity and reading experience (21–30)
| # | Status | Notes |
|---|---|---|
| 21 | I | Ivory/ink/gold tokens, hairline rules |
| 22 | I | EB Garamond (OFL) + Inter (OFL) + Amiri (OFL), self-hosted |
| 23 | I | Serif body text, 1.75 leading, measured widths |
| 24 | T | Light/sepia/dark; contrast measured (docs/ACCESSIBILITY.md) + axe |
| 25 | I | Original open-book + cross mark |
| 26 | I | No promos or clutter |
| 27 | I | CSS tokens in `globals.css` |
| 28 | I | Subtle chapter fade, card flip; reduced-motion disables |
| 29 | T | Overflow checks at phone, landscape, tablet, wide |
| 30 | I | Original assets only; documented in Credits |

## Navigation and home page (31–40)
| # | Status | Notes |
|---|---|---|
| 31 | T | Reader and book browser on home |
| 32 | T | Search bar with “John 3:16” hint |
| 33 | T | Translation + book + chapter selectors with explanations |
| 34 | T | OT / deuterocanon / NT browser per edition |
| 35 | T | Daily verse card: open, copy, share, bookmark, flashcard (signed in) |
| 36 | T | Continue reading (device or account) / start with John |
| 37 | I | All nav items present |
| 38 | T | Personal area: saved verses, due cards, plan progress, recent reading |
| 39 | I | Desktop nav + accessible mobile menu (Esc, focus) |
| 40 | I | Footer links |

## Accounts and email verification (41–50)
| # | Status | Notes |
|---|---|---|
| 41 | T | Validation, live rules, show-password |
| 42 | T | Real verification email; check-your-email; unverified refused |
| 43 | T | `/auth/confirm` handles token_hash and PKCE code; allow-listed redirects; expired/invalid page |
| 44 | T | Resend with UI cooldown + server limits (bug found and fixed) |
| 45 | T | Sign-in/out, session refresh in proxy, expiry → signed-out |
| 46 | T | Forgot/reset with one-time link |
| 47 | T | `requireVerifiedUser` on every private action + RLS |
| 48 | T | Guests: full reading, search, daily verse, Watch |
| 49 | T | Settings: name, language, translation, theme, size, timezone |
| 50 | I | Google button only when configured (not tested: no provider) |

## Personal data and privacy (51–60)
| # | Status | Notes |
|---|---|---|
| 51 | I | Plain-language notes on sign-up, guidance and privacy pages |
| 52 | T | Owner-scoped tables |
| 53 | T | RLS + server checks (34 DB assertions, 2-user e2e) |
| 54 | I | Supabase cookie sessions; Server Actions’ Origin check; SameSite cookies |
| 55 | I | No request/journal text in logs; admin shows aggregates only |
| 56 | T | Guidance saving optional and explicit |
| 57 | T | JSON export |
| 58 | T | Deletion with password reauth; cascade verified |
| 59 | I | Email + password only |
| 60 | P | Privacy/Terms match behaviour; operator details are placeholders needing your input |

## Complete Bible data and edition support (61–70)
| # | Status | Notes |
|---|---|---|
| 61 | T | WEB from eBible.org |
| 62 | T | 81 books / 1,402 chapters / 38,058 verses |
| 63 | T | Provenance, hashes, licence notes recorded per edition |
| 64 | T | Collections explicit; deuterocanon labelled |
| 65 | T | Only imported editions offered |
| 66 | T | English, French (LSG 1910) and Arabic (Van Dyck) complete, verified PD |
| 67 | T | Edition-specific book lists and verse counts; conservative mapping |
| 68 | T | Import script + validation reports (100% VPL match) |
| 69 | T | Text never altered; notes/reflections separate |
| 70 | I | docs/BIBLE_PROVIDERS.md |

## Bible reader (71–80)
| # | Status | Notes |
|---|---|---|
| 71 | T | Home reader + `/bible/[edition]/[book]/[chapter]?v=` |
| 72 | I | Grouped book select; chapter list from data |
| 73 | T | Verse numbers; `?v=` highlights in chapter context |
| 74 | T | Prev/next across books in canonical order |
| 75 | I | Size, spacing, width, paragraph/verse layout |
| 76 | I | Cookie prefs; account wins at sign-in (documented) |
| 77 | T | Position saved after 4 s dwell, one upsert per chapter |
| 78 | I | Focus mode with exit control |
| 79 | T | Keyboard, labels, focus, axe |
| 80 | T | 404, missing-in-edition, error boundary with retry |

## Verse lookup and search (81–90)
| # | Status | Notes |
|---|---|---|
| 81–83 | T | Parser tests incl. numbered books, abbreviations, FR/AR, bounds messages |
| 84 | T | Inverted index, pagination, relevance ranking |
| 85 | T | Search scoped to selected edition |
| 86 | T | Reference, translation, excerpt, open chapter |
| 87 | T | Safe highlighting without HTML |
| 88 | T | Book and collection filters + reset |
| 89 | I | All state in URL |
| 90 | T | No-results help; reference vs keyword distinction |

## Bookmarks, highlights, notes, sharing (91–100)
| # | Status | Notes |
|---|---|---|
| 91–94 | T | Persist after reload; library views searchable |
| 95 | I | Records keyed by edition |
| 96 | I | Tags: Prayer, Hope, Family, Favorites, Peace, Strength |
| 97 | I | Copy with reference + attribution; clipboard fallback |
| 98 | T | `/p/[edition]/[ref]` Scripture-only |
| 99 | I | Canvas PNG share card (own fonts/colours) |
| 100 | I | Optimistic updates with rollback |

## Daily verse (101–110)
| # | Status | Notes |
|---|---|---|
| 101 | T | 45 curated entries, refs validated |
| 102 | T | Deterministic by local date; guest default documented |
| 103 | T | Daily verse merged into /flashcards (today’s verse is the first card); old /daily links redirect (e2e) |
| 104 | I | Selected edition with mapping/fallback notice |
| 105–106 | I | Editorial reflection, prayer prompt, question — labelled |
| 107 | T | Save, flashcard, share, open chapter |
| 108 | I | `/daily/[date]` → `/flashcards?date=…`; archive → `/flashcards` |
| 109 | I | Opt-in calendar (.ics) reminder; no push/permission prompt (no push server) |
| 110 | I | No streaks or guilt language |

## Flashcards (111–130)
| # | Status | Notes |
|---|---|---|
| 111–114 | T/I | Decks from reader/daily verse; ref→text, text→ref, cloze (from real verse) |
| 115 | I | Custom cards labelled “not Scripture” |
| 116 | T | Tap/button/keyboard flip; reduced motion |
| 117 | T | Again/Hard/Good/Easy; docs/FLASHCARDS.md |
| 118 | T | Review history, due date, deck, edition, ref, type |
| 119 | T | Due queue, deck progress, practice mode |
| 120 | T | Edit/delete decks; duplicate prevention |
| 121–125 | T | Deterministic tested scheduler; timezone rules; idempotent + versioned reviews; failed saves keep card |
| 126–127 | I | Daily goal; activity counts only |
| 128 | I | Reset deck with confirmation |
| 129 | I | Original edition kept; explicit copy to another translation |
| 130 | T | Unit + DB + e2e tests |

## Reading plans (131–140)
| # | Status | Notes |
|---|---|---|
| 131–133 | T | 4 real plans; details before enrolment |
| 134 | T | Start, pause, resume, leave |
| 135 | I | Links open exact passages |
| 136–137 | T | Explicit completion; progress view |
| 138 | I | Shift schedule without losing completed days |
| 139 | T | Private, date-based on user timezone |
| 140 | T | Every assignment validated; conflicts shown per edition |

## AI guidance (141–170)
| # | Status | Notes |
|---|---|---|
| 141–144 | I | Page, topics, explanation, bounded input + tone |
| 145 | T | Verified sign-in + durable quotas (`reserve_ai_request`) |
| 146 | T | Curated topics + indexed search retrieval |
| 147 | I | Only request + ≤16 candidates sent; per-edition `aiProcessingAllowed` |
| 148–151 | T | Model picks ids only; strict schema; server validation rejects invented refs |
| 152–154 | I | Scripture vs reflection separated and labelled; context note; Open/Read chapter actions |
| 155–158 | P | System rules written and tested for presence; real model behaviour not verified (no key) |
| 159 | T | Crisis short-circuit, no invented numbers |
| 160 | P | Ordinary/ambiguous/invalid/injection/failure tested with mocked provider; live provider untested (B) |
| 161 | I | Key server-only |
| 162–164 | T | Per-user daily + per-minute limits; bounded tokens/timeout/retries; honest failure states |
| 165 | T | Labelled curated fallback |
| 166 | T | Input wrapped as data; tag-escaping test |
| 167 | I | No caching of private requests |
| 168 | T | Explicit save + delete |
| 169 | I | No zero-retention claim |
| 170 | I | Admin aggregates without content |

## Watch (171–180)
| # | Status | Notes |
|---|---|---|
| 171–173 | T | Watch page; The Chosen → https://watch.thechosen.tv/ (HTTP 200 on 2026-11-08); external links |
| 174–175 | I | No embeds/hosting/scraping; CSP limits frames |
| 176–177 | I | Two verified entries with metadata and check dates |
| 178 | P | Type filter; age guidance omitted (no verified rating source) |
| 179 | I | Private watchlist + manual watched |
| 180 | I | Dramatization labels, no-affiliation notice |

## Prayer journal (181–190)
| # | Status | Notes |
|---|---|---|
| 181–185 | T | Entries with refs/tags/status, prompts, edit/delete/search, private badge; never sent to AI |
| 186 | I | Per-user sessionStorage draft recovery |
| 187 | I | Quiet timer, silent by default |
| 188 | T | noindex + no-store on private routes |
| 189 | T | In export; deleted with account |
| 190 | I | No social features |

## Learning additions (191–200)
| # | Status | Notes |
|---|---|---|
| 191 | I | Discover with 15 topics |
| 192 | P | Editorial introductions for 16 books (not all) |
| 193 | I | WEB’s own cross-references only |
| 194 | T | Parallel reading with numbering warnings |
| 195 | I | Practice mode reuses flashcard corpus |
| 196 | I | Beginner’s guide |
| 197 | T | RTL for Arabic UI and Scripture |
| 198 | P | Main UI strings in en/fr/ar; secondary pages (legal, help, account, admin, auth) English only |
| 199 | T | Public passage pages with metadata |
| 200 | I | No dead buttons; unfinished items listed here |

## Database and administration (201–210)
| # | Status | Notes |
|---|---|---|
| 201–204 | T | Tables, keys, constraints, indexes, uniqueness |
| 205–207 | T | RLS on all private tables; admin role not self-assignable |
| 208 | I | Admin editor with draft/published |
| 209 | T | Audit log without private text |
| 210 | T | Single migration; idempotent seed/import scripts |

## Testing and accessibility (211–220)
| # | Status | Notes |
|---|---|---|
| 211 | T | Full-corpus parser/search tests |
| 212 | T | Full account sequence on local Supabase + Mailpit; production SMTP not tested |
| 213–214 | T | Persistence and two-user authorization |
| 215 | T | Real retrieval/validation path with mocked provider in tests only |
| 216 | T | Quota and duplicate tests |
| 217 | T | e2e for reader, search, accounts, flashcards, plans, guidance, Watch |
| 218 | P | Keyboard, labels, focus, contrast, reduced motion, axe; no manual screen-reader pass |
| 219 | T | Representative widths; Arabic and French UI |
| 220 | I | This file + TESTING.md |

## Performance, security, operations (221–230)
| # | Status | Notes |
|---|---|---|
| 221 | I | One chapter per page load |
| 222 | T | Indexed search |
| 223 | I | Public data cached in-process; private responses no-store |
| 224 | I | Self-hosted fonts with unicode-range subsets; small client components |
| 225 | T | Zod on all inputs; text-only rendering |
| 226 | T | CSP with nonce + security headers; 0 violations in production |
| 227 | I | Current versions; 0 production audit findings |
| 228 | P | Health endpoint; no error-monitoring service wired (guidance in OPERATIONS.md) |
| 229 | I | DEPLOYMENT.md / OPERATIONS.md |
| 230 | T | lint, typecheck, tests, build all clean |

## GitHub, Vercel, handoff (231–240)
| # | Status | Notes |
|---|---|---|
| 231 | I | Target repo `itaaxl/Abide-`, branch `claude/new-session-sl4l5s` |
| 232–233 | I | README, .gitignore, secret scan before commit |
| 234 | I | Meaningful commits pushed |
| 235 | I | Vercel settings documented (no vercel.json needed) |
| 236 | B | No Vercel access in this environment |
| 237 | B | Needs real domain + Supabase project |
| 238 | P | Launch checklist below; items needing services remain open |
| 239–240 | I | Handoff in README / final report |

## Launch checklist
- [x] Complete Bible content validated (3 editions)
- [x] Search accuracy tests on full corpus
- [ ] Operator details filled in Privacy/Terms; legal review
- [x] Authentication flows verified on local Supabase · [ ] verified on production project + SMTP
- [x] Private data isolation (RLS + two-user e2e)
- [x] AI limits implemented · [ ] live Anthropic call verified · [ ] Console spend limit set
- [x] Official media links verified (re-check before launch)
- [x] Mobile layouts checked
- [ ] Deploy preview on Vercel, set env vars, test `/api/health` and sign-up on the real domain
