-- Cache of AI-generated flashcard selections, reused to avoid repeat model calls.
-- Stores only passage references and short reflections, never the request text:
-- personal-goal requests are keyed by a one-way hash scoped to the user.
create table if not exists public.ai_card_cache (
  cache_key text primary key check (char_length(cache_key) = 64),
  user_id uuid references auth.users (id) on delete cascade,
  result jsonb not null,
  model text not null,
  created_at timestamptz not null default now()
);
create index if not exists ai_card_cache_created_idx on public.ai_card_cache (created_at);

-- Server-only (service role). No policies: clients cannot read or write it.
alter table public.ai_card_cache enable row level security;
revoke all on public.ai_card_cache from anon, authenticated;
