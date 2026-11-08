# Authentication email (Supabase Auth + Resend)

## Why links opened localhost (fixed 2026-11-08)
Supabase only redirects to URLs on its allow-list. The project still had the default Site URL `http://localhost:3000` and an empty allow-list, so every email link fell back to localhost. Fixed via the Management API:
- Site URL: `https://abide-omega.vercel.app`
- Allowed redirects: `https://abide-omega.vercel.app/auth/confirm`, `…/auth/confirm?**`, `https://abide-omega.vercel.app/**` (no localhost)
- Minimum password length 10; email code/link expiry 900 s (15 min); code length 8

`npm run supabase:auth-config` re-applies these settings and the templates (needs `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SITE_URL`). With a sandbox proxy, run it with `NODE_USE_ENV_PROXY=1`.

## Methods implemented
- **Preferred: email one-time code.** `signInWithOtp` (existing accounts only) sends a Supabase-generated 8-digit code; `verifyOtp({ type: "email" })` checks it on the server and sets the session cookie. Codes expire after 15 minutes, work once, and only the newest is valid.
- The same email also has a **button** (`/auth/confirm?token_hash=…`). It is also single-use and expires after 15 minutes. It is verified on the server, so it works even if the email opens in a different browser.
- **Account verification** (new accounts) uses its own email ("Confirm your Abide account") with a code and a button. **Password sign-in** and **password recovery** (button or code) still work.
- Limits: one email per address per minute (server + UI countdown), 10 code emails per network per hour, 5 code attempts per address per 15 minutes, 30 per network. Provider errors are always shown; the app never claims an email was sent when Supabase reported a failure.

The code screens are switched on by `NEXT_PUBLIC_AUTH_EMAIL_CODES=true`. Keep it off until the branded templates are live: Supabase's default templates contain links only.

## Connecting Resend (required for templates and real delivery)
Supabase's built-in sender only delivers to project team members (2 emails/hour), and **free-tier projects cannot change email templates until custom SMTP is configured**.

1. Resend → Domains → add a domain you own and add its DNS records (Resend shows them). Wait for “Verified”.
2. Resend → Settings → Integrations → Supabase → Connect. Choose the Abide project, sender name `Abide`, sender address e.g. `hello@<your-domain>`. This creates a Resend key and fills in Supabase's SMTP settings, so no key is copied by hand.
3. Then apply the templates (`npm run supabase:auth-config`), raise Supabase's email rate limit (Auth → Rate limits), and set `NEXT_PUBLIC_AUTH_EMAIL_CODES=true` in Vercel and redeploy.

Templates live in `supabase/templates/`. They are also used by the local Supabase stack (`supabase/config.toml`), where `npm run test:e2e:email` tests every flow.
