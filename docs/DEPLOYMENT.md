# Deployment

## 1. Supabase (database + authentication)

1. Create a project at supabase.com (choose a region near your users).
2. Apply migrations in order (`supabase/migrations/*.sql`): paste into the SQL editor, or `supabase link && supabase db push`. Migrations must be applied **before** deploying code that depends on them.
3. Keys (Project settings → API):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (public)
   - `SUPABASE_SECRET_KEY` (service role — server-only; never expose to the browser)
4. Authentication settings:
   - **Email provider:** enabled, “Confirm email” ON, minimum password length ≥ 10 (the app also enforces 10 + letter + number).
   - **URL configuration:** Site URL `https://YOUR_DOMAIN`; Redirect URLs `https://YOUR_DOMAIN/auth/confirm`, preview URLs (e.g. `https://*-your-team.vercel.app/auth/confirm`) and `http://localhost:3000/auth/confirm`.
   - **SMTP:** configure a production email provider (Resend, Postmark, SES, …) under Authentication → SMTP. The built-in sender is heavily rate-limited and only for testing. Set up SPF/DKIM for the sending domain.
   - **Email templates (recommended, token-hash flow):**
     - Confirm signup: `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/">Confirm your email</a>`
     - Reset password: `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset">Reset your password</a>`
     The default templates (`{{ .ConfirmationURL }}`) also work: the callback handles the PKCE `code` parameter.
   - **Google (optional):** enable the provider with your Google OAuth client, then set `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true`. The button is hidden otherwise.
5. Seed curated content (optional, enables editing in `/admin`): `npm run db:seed`.
6. Grant admin (SQL only): `update public.profiles set role='admin' where id=(select id from auth.users where email='…');`

## 2. Vercel

1. Import the GitHub repository (framework: Next.js; build command `next build`; output default; Node 22).
2. Environment variables (Production and Preview): everything in `.env.example` that you use. `NEXT_PUBLIC_SITE_URL` must be the exact public origin for each environment (auth email links use it).
3. Deploy, then verify:
   - `GET /api/health` → `{"status":"ok"}` with `bible: ok`, `auth: ok`, `database: ok`, `ai: ok|unconfigured`.
   - Sign up with a real address, receive the email, follow the link, land signed in.
   - Request a password reset and complete it.
4. Custom domain: add it in Vercel, then update `NEXT_PUBLIC_SITE_URL` and Supabase Site URL / Redirect URLs to match.

### Bundle note
Bible data (~39 MB of JSON across 3 editions) is read from `data/bibles` at runtime and included in server functions via `outputFileTracingIncludes`. This is well within Vercel’s function size limit; Turbopack prints an informational warning about the broad file pattern during build, which is expected.

## 3. Anthropic (Find Guidance)

Create an API key in the Anthropic Console, set `ANTHROPIC_API_KEY` (server-only) and keep `SUPABASE_SECRET_KEY` set (quotas). Set a monthly spend limit in the Console. AI costs scale with usage: each request sends roughly 1–3k input tokens and receives up to `AI_MAX_OUTPUT_TOKENS`.

## 4. Order of operations for releases

1. Apply new migrations (backwards-compatible first).
2. Deploy code.
3. Run `npm run db:seed` if seed content changed (add `-- --force` to overwrite admin edits deliberately).

## 5. Backups and restore

- Supabase daily backups are included on paid plans; Point-in-Time Recovery is an add-on. The free plan has no automated backups — export regularly with `supabase db dump` if you stay on it.
- Restore: create a new project from a backup (or `psql < dump.sql`), re-apply any later migrations, update environment variables.
- Scripture data lives in Git (`data/bibles`) and can always be regenerated with `npm run bible:import`.
