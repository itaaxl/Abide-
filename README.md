# Abide

A calm, Bible-first website: the complete Bible in English, French and Arabic, search, a daily verse, memory flashcards, reading plans, a private prayer journal, optional AI help finding passages, and a curated Watch page.

“Abide” is an **editable working name** — rename the site in [`src/config/site.ts`](src/config/site.ts). Trademark and domain availability have not been checked.

## What’s included

| Area | Status |
| --- | --- |
| Bible reader (home page + deep links), 3 complete public-domain editions | ✅ WEB (81 books incl. deuterocanon), Louis Segond 1910, Smith & Van Dyck Arabic — every verse validated against the publisher’s plain text |
| Reference lookup and indexed keyword search | ✅ English/French/Arabic book names, ranges, bounds checks, filters, pagination |
| Accounts (Supabase): sign-up + email verification, sign-in, reset, export, deletion | ✅ code complete; needs a Supabase project to run |
| Bookmarks/tags, highlights, notes, My Library | ✅ |
| Daily verse with editorial reflection, archive, calendar reminder | ✅ |
| Flashcards with documented spaced repetition, idempotent reviews | ✅ |
| Reading plans with explicit completion, pause, catch-up | ✅ |
| Prayer journal (private, never sent to AI) + prayer timer | ✅ |
| Find Guidance (Claude), quotas, curated fallback | ✅ code complete; needs `ANTHROPIC_API_KEY` + service key |
| Watch page (official links only), watchlist | ✅ |
| Admin area for curated content, audit log, usage aggregates | ✅ |

The full requirement-by-requirement status is in [`docs/CHECKLIST.md`](docs/CHECKLIST.md). Remaining launch blockers are listed at the end of this README.

## Quick start

Requirements: Node.js ≥ 20.9 (22 recommended).

```bash
npm install
cp .env.example .env.local     # optional: works without any values
npm run dev                    # http://localhost:3000
```

With no environment variables the full Bible reader, search, daily verse, plans preview, Discover and Watch work. Account and AI features show an honest “not configured” state.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js development, production build, production server |
| `npm run lint` / `typecheck` | ESLint, TypeScript |
| `npm test` | Unit tests (reference parsing & search on the full corpus, scheduler, guidance pipeline, content validation, redirects) |
| `npm run test:db` | Applies migrations to a throwaway PostgreSQL DB and runs two-user row-level-security tests (needs `psql` + `PGHOST`/`PGUSER`) |
| `npm run test:e2e` | Playwright + axe guest checks against a running server (`BASE_URL`, default `http://localhost:3000`) |
| `npm run test:e2e:accounts` | Signed-in checks against a Supabase stack with Mailpit (`npx supabase start`, app configured via `.env.local`) |
| `npm run bible:import` | Re-downloads the editions from eBible.org, re-validates, regenerates `data/bibles` and `docs/validation/*.md` |
| `npm run db:seed` | Idempotently seeds curated content into Supabase (service key required) |
| `npm run db:import-bible` | Optional: mirrors the Bible text into `bible_*` tables |
| `npm run check` | lint + typecheck + unit tests + build |

## Set up accounts (Supabase)

1. Create a Supabase project. In **SQL editor**, run [`supabase/migrations/20261108000000_initial_schema.sql`](supabase/migrations) (or `supabase db push` with the Supabase CLI).
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` (server-only).
3. **Authentication → URL configuration**: Site URL = your `NEXT_PUBLIC_SITE_URL`; add redirect URL `https://YOUR_DOMAIN/auth/confirm` (and `http://localhost:3000/auth/confirm` for development).
4. Ensure **Confirm email** is enabled. Configure a production SMTP provider for reliable delivery (Supabase’s built-in sender is rate-limited and intended for testing).
5. Optional: `npm run db:seed` to copy curated content into the database for editing in `/admin`.
6. Make yourself an administrator (only possible in SQL — never via the app):
   ```sql
   update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
   ```

Details, email templates and production checklist: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Enable Find Guidance (AI)

Set `ANTHROPIC_API_KEY` **and** `SUPABASE_SECRET_KEY` (quotas are enforced in the database; without it AI stays off). Model, effort, token, timeout, retry and daily limits are configured with `AI_*` variables in [`.env.example`](.env.example). The default model is `claude-opus-5-5`.

## Deploy to Vercel

Import the repository in Vercel (framework preset: Next.js, default build command), add the environment variables above for Production and Preview, and set `NEXT_PUBLIC_SITE_URL` to the deployment’s domain. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Project layout

```
src/app/            routes (App Router), server actions in src/app/actions
src/components/     UI components (reader, auth, flashcards, journal, guidance, admin)
src/lib/bible/      provider interface, reference parser, search index, mapping
src/lib/guidance/   retrieval, prompt, schema, safety, Anthropic adapter
src/lib/            auth, prefs, i18n, time, scheduler, rate limits
src/content/        curated editorial seed content (daily verses, plans, topics, media)
data/bibles/        imported, validated Scripture (generated by npm run bible:import)
supabase/migrations SQL schema with row-level security
scripts/            importer, db seed/import, db test runner
tests/              unit, database (RLS) and e2e tests
docs/               architecture, deployment, operations, checklist, validation reports
```

## Known launch blockers

- No hosted Supabase project, production email provider, Anthropic key, Vercel project or domain were available while building. Account flows were verified end-to-end against a **local** Supabase stack with real verification and reset emails (Mailpit); production email delivery, live AI responses and deployment have **not** been exercised (see [`docs/TESTING.md`](docs/TESTING.md)).
- Operator name, contact email and jurisdiction in `src/config/site.ts` are placeholders; Privacy and Terms are drafts that need the operator’s review.
- The working name “Abide” has not been checked for trademark or domain availability.
