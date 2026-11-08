# Progress (resume file)

**State (2026-11-08):** All five milestones implemented on branch `claude/new-session-sl4l5s`; lint, typecheck, unit (46), RLS (34), guest e2e (32) and signed-in e2e (28) all pass. See CHECKLIST.md for per-requirement status.

## Key decisions
- Next.js 16 with Cache Components off (cookie-driven pages); nonce CSP in `src/proxy.ts`.
- Scripture as versioned JSON in `data/bibles` (WEB, LSG 1910, Van Dyck), validated against publisher VPL text; KJV and copyrighted editions excluded.
- Conservative cross-edition mapping; content refs written in WEB numbering.
- AI only runs with a service key (durable quotas); otherwise curated fallback.
- Preferences: account wins at sign-in, then last change wins.

## Commands
```bash
npm install && npm run dev
npm run check                 # lint + types + unit + build
PGHOST=... PGUSER=postgres npm run test:db
npx supabase start            # local Supabase (Docker) for account e2e
npm run build && npm start & npm run test:e2e && npm run test:e2e:accounts
```

## Next actions
1. Create the Supabase project, apply the migration, configure SMTP and redirect URLs (docs/DEPLOYMENT.md).
2. Import the repo into Vercel, set env vars, deploy a preview, run `/api/health` and a real sign-up.
3. Add `ANTHROPIC_API_KEY` and verify one live guidance request; set a spend limit.
4. Fill operator details in `src/config/site.ts`; review Privacy/Terms.
5. Deferred: remaining book introductions, translating secondary pages, error monitoring, manual screen-reader pass.
