# Operations

## Health and monitoring
- `GET /api/health` reports `bible`, `auth`, `database`, `ai` as `ok` / `unconfigured` / `error` (HTTP 503 when degraded). It never returns keys, URLs or personal data. Point an uptime monitor (e.g. Vercel Monitoring, Better Stack) at it.
- Server logs contain only outcome categories (e.g. `guidance: provider error {status: 529}`), never request text, notes, journal entries or emails. Keep it that way when adding logging.
- Error tracking: none is bundled. If you add one (e.g. Sentry), disable request-body capture, scrub `request_text`, `body`, `title`, `note` fields, and do not enable session replay on private pages.
- Admin → AI usage shows per-day aggregates (users, requests, tokens, failures) without content.

## Limits and abuse protection
| Control | Default | Where |
| --- | --- | --- |
| AI requests per user per day | 10 | `AI_DAILY_LIMIT_PER_USER`, enforced atomically by `reserve_ai_request()` |
| AI requests per user per minute | 3 | `AI_PER_MINUTE_LIMIT_PER_USER` |
| AI input length | 1000 chars | `AI_MAX_INPUT_CHARS` |
| AI output tokens / timeout / retries | 4000 / 60 s / 1 | `AI_MAX_OUTPUT_TOKENS`, `AI_TIMEOUT_MS`, `AI_MAX_RETRIES` |
| Sign-up per IP | 5/hour | `signUpAction` |
| Sign-in | 20/15 min per IP, 10/15 min per email | `signInAction` |
| Verification resend | 1/min per email, 5/hour per IP | `resendVerificationAction` |
| Password reset | 1/min per email, 5/hour per IP | `forgotPasswordAction` |

Rate limits use the `consume_rate_limit()` database function when `SUPABASE_SECRET_KEY` is set (durable across serverless instances; keys are SHA-256 hashed, so no raw emails or IPs are stored). Without the service key, an in-memory per-instance limiter is used — weaker on serverless — and AI is disabled entirely. Supabase Auth applies its own email rate limits as well.

## Caching
- Scripture is public, immutable data read from versioned files; the provider caches edition metadata and the search index in memory per server instance.
- Pages are rendered per request (they read preference and auth cookies). Responses that set auth cookies carry `Cache-Control: private, no-store` (from `@supabase/ssr`), and private areas get `private, no-store` + `X-Robots-Tag: noindex` from `src/proxy.ts`. No private content is placed in shared caches.

## Costs (no promise of zero cost)
- Vercel: Hobby is free for non-commercial use; commercial sites need Pro.
- Supabase: free tier has limits and no automated backups; Pro adds backups.
- Email provider: usually free for low volume.
- Anthropic: pay per token; bounded by the daily per-user limit × users. Set a Console spend limit.
- Domain registration.

## Known warning
`next build` prints a Turbopack warning that `src/lib/bible/provider.ts` matches ~15k data files. This is intentional: those chapter files are required at runtime.
