-- Abide initial schema.
-- Public Scripture text lives in versioned data files (data/bibles) and can
-- optionally be mirrored into bible_* tables with `npm run db:import-bible`.
-- Every private table has row-level security restricting rows to their owner.

create extension if not exists pgcrypto;

-------------------------------------------------------------------------------
-- Profiles and roles
-------------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  role text not null default 'user' check (role in ('user', 'admin')),
  preferences jsonb not null default '{}'::jsonb,
  timezone text not null default 'UTC' check (char_length(timezone) <= 64),
  daily_review_target int not null default 20 check (daily_review_target between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "profiles: owner reads" on public.profiles for select using (auth.uid() = id);
create policy "profiles: owner updates" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Users may never change their own role: only listed columns are updatable.
revoke update on public.profiles from authenticated, anon;
grant update (display_name, preferences, timezone, daily_review_target, updated_at) on public.profiles to authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-------------------------------------------------------------------------------
-- Bible editions (optional database mirror of data/bibles)
-------------------------------------------------------------------------------
create table public.bible_editions (
  id text primary key,
  name text not null,
  abbreviation text not null,
  language text not null,
  direction text not null check (direction in ('ltr', 'rtl')),
  license jsonb not null,
  source jsonb not null,
  imported_at timestamptz not null default now()
);
create table public.bible_books (
  edition_id text not null references public.bible_editions (id) on delete cascade,
  book text not null,
  name text not null,
  collection text not null check (collection in ('ot', 'deuterocanon', 'nt')),
  sort_order int not null,
  chapter_verse_counts int[] not null,
  primary key (edition_id, book)
);
create table public.bible_verses (
  edition_id text not null,
  book text not null,
  chapter int not null,
  verse int not null,
  verse_end int,
  text text not null,
  search tsvector generated always as (to_tsvector('simple', text)) stored,
  primary key (edition_id, book, chapter, verse),
  foreign key (edition_id, book) references public.bible_books (edition_id, book) on delete cascade
);
create index bible_verses_search_idx on public.bible_verses using gin (search);

alter table public.bible_editions enable row level security;
alter table public.bible_books enable row level security;
alter table public.bible_verses enable row level security;
create policy "editions: public read" on public.bible_editions for select using (true);
create policy "books: public read" on public.bible_books for select using (true);
create policy "verses: public read" on public.bible_verses for select using (true);

-------------------------------------------------------------------------------
-- Private user data
-------------------------------------------------------------------------------
create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  edition text not null,
  book text not null check (book ~ '^[A-Z0-9]{3}$'),
  chapter int not null check (chapter > 0),
  verse_start int not null check (verse_start > 0),
  verse_end int not null,
  tags text[] not null default '{}' check (cardinality(tags) <= 10),
  created_at timestamptz not null default now(),
  check (verse_end >= verse_start),
  unique (user_id, edition, book, chapter, verse_start, verse_end)
);
create index bookmarks_user_idx on public.bookmarks (user_id, created_at desc);

create table public.highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  edition text not null,
  book text not null check (book ~ '^[A-Z0-9]{3}$'),
  chapter int not null check (chapter > 0),
  verse int not null check (verse > 0),
  color text not null check (color in ('yellow', 'green', 'blue', 'rose')),
  created_at timestamptz not null default now(),
  unique (user_id, edition, book, chapter, verse)
);
create index highlights_user_chapter_idx on public.highlights (user_id, edition, book, chapter);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  edition text not null,
  book text not null check (book ~ '^[A-Z0-9]{3}$'),
  chapter int not null check (chapter > 0),
  verse_start int not null check (verse_start > 0),
  verse_end int not null,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (verse_end >= verse_start)
);
create index notes_user_chapter_idx on public.notes (user_id, edition, book, chapter);

create table public.reading_positions (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  edition text not null,
  book text not null,
  chapter int not null,
  updated_at timestamptz not null default now()
);

create table public.reading_history (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  edition text not null,
  book text not null,
  chapter int not null,
  read_on date not null default current_date,
  primary key (user_id, edition, book, chapter, read_on)
);

-- Flashcards ------------------------------------------------------------------
create table public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text check (char_length(description) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  deck_id uuid not null references public.decks (id) on delete cascade,
  kind text not null check (kind in ('ref_to_text', 'text_to_ref', 'cloze', 'custom')),
  edition text,
  book text,
  chapter int,
  verse_start int,
  verse_end int,
  front text check (char_length(front) <= 1000),
  back text check (char_length(back) <= 2000),
  -- Scheduler state (see src/lib/srs.ts)
  due_at timestamptz not null default now(),
  interval_days int not null default 0,
  ease real not null default 2.5,
  reps int not null default 0,
  lapses int not null default 0,
  last_reviewed_at timestamptz,
  version int not null default 0,
  created_at timestamptz not null default now(),
  check (
    (kind = 'custom' and front is not null and back is not null)
    or (kind <> 'custom' and edition is not null and book is not null and chapter is not null and verse_start is not null and verse_end is not null)
  )
);
create unique index cards_unique_passage on public.cards (deck_id, kind, edition, book, chapter, verse_start, verse_end) where kind <> 'custom';
create index cards_due_idx on public.cards (user_id, due_at);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  request_id uuid not null unique, -- idempotency key from the client
  rating text not null check (rating in ('again', 'hard', 'good', 'easy')),
  prev_interval int not null,
  new_interval int not null,
  due_at timestamptz not null,
  reviewed_at timestamptz not null default now()
);
create index reviews_user_idx on public.reviews (user_id, reviewed_at desc);

-- Reading plans ---------------------------------------------------------------
create table public.plan_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  plan_slug text not null,
  edition text not null,
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'left')),
  start_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index plan_enrollments_one_open on public.plan_enrollments (user_id, plan_slug) where status <> 'left';

create table public.plan_progress (
  enrollment_id uuid not null references public.plan_enrollments (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day int not null check (day > 0),
  completed_at timestamptz not null default now(),
  primary key (enrollment_id, day)
);

-- Journal, guidance, watchlist -----------------------------------------------
create table public.prayer_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 140),
  body text not null default '' check (char_length(body) <= 20000),
  refs text[] not null default '{}' check (cardinality(refs) <= 20),
  tags text[] not null default '{}' check (cardinality(tags) <= 10),
  status text not null default 'ongoing' check (status in ('ongoing', 'answered', 'reflection')),
  entry_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index prayer_entries_user_idx on public.prayer_entries (user_id, entry_date desc);

create table public.saved_guidance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  request_text text not null check (char_length(request_text) <= 1000),
  topic text,
  edition text not null,
  response jsonb not null,
  created_at timestamptz not null default now()
);

create table public.watchlist (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  media_slug text not null,
  watched boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, media_slug)
);

-- Owner-only RLS on every private table.
do $$
declare t text;
begin
  foreach t in array array['bookmarks','highlights','notes','reading_positions','reading_history','decks','cards',
                           'reviews','plan_enrollments','plan_progress','prayer_entries','saved_guidance','watchlist']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%1$s: owner select" on public.%1$I for select using (auth.uid() = user_id)', t);
    execute format('create policy "%1$s: owner insert" on public.%1$I for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "%1$s: owner update" on public.%1$I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "%1$s: owner delete" on public.%1$I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

-- A card must belong to a deck owned by the same user.
create or replace function public.cards_same_owner() returns trigger language plpgsql as $$
begin
  if not exists (select 1 from public.decks d where d.id = new.deck_id and d.user_id = new.user_id) then
    raise exception 'deck does not belong to user';
  end if;
  return new;
end $$;
create trigger cards_same_owner before insert or update on public.cards for each row execute function public.cards_same_owner();

create or replace function public.progress_same_owner() returns trigger language plpgsql as $$
begin
  if not exists (select 1 from public.plan_enrollments e where e.id = new.enrollment_id and e.user_id = new.user_id) then
    raise exception 'enrollment does not belong to user';
  end if;
  return new;
end $$;
create trigger progress_same_owner before insert or update on public.plan_progress for each row execute function public.progress_same_owner();

-------------------------------------------------------------------------------
-- Flashcard review: atomic, idempotent, optimistic-concurrency update
-------------------------------------------------------------------------------
create or replace function public.record_review(
  p_card_id uuid, p_request_id uuid, p_rating text, p_expected_version int,
  p_interval int, p_ease real, p_reps int, p_lapses int, p_due_at timestamptz
) returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  existing public.reviews;
  c public.cards;
begin
  select * into existing from public.reviews where request_id = p_request_id;
  if found then
    return jsonb_build_object('status', 'duplicate', 'due_at', existing.due_at);
  end if;
  select * into c from public.cards where id = p_card_id and user_id = auth.uid() for update;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;
  if c.version <> p_expected_version then
    return jsonb_build_object('status', 'conflict', 'version', c.version);
  end if;
  update public.cards set interval_days = p_interval, ease = p_ease, reps = p_reps, lapses = p_lapses,
    due_at = p_due_at, last_reviewed_at = now(), version = version + 1 where id = p_card_id;
  insert into public.reviews (user_id, card_id, request_id, rating, prev_interval, new_interval, due_at)
    values (auth.uid(), p_card_id, p_request_id, p_rating, c.interval_days, p_interval, p_due_at);
  return jsonb_build_object('status', 'ok', 'version', c.version + 1);
end $$;

-------------------------------------------------------------------------------
-- Curated editorial content (public read when published; admin write)
-------------------------------------------------------------------------------
create table public.content_daily_verses (
  id text primary key,
  ref_key text not null,
  topic text not null,
  reflection text not null,
  prayer text,
  question text,
  status text not null default 'published' check (status in ('draft', 'published')),
  updated_at timestamptz not null default now()
);
create table public.content_plans (
  slug text primary key,
  data jsonb not null,
  status text not null default 'published' check (status in ('draft', 'published')),
  updated_at timestamptz not null default now()
);
create table public.content_topics (
  slug text primary key,
  data jsonb not null,
  status text not null default 'published' check (status in ('draft', 'published')),
  updated_at timestamptz not null default now()
);
create table public.content_media (
  slug text primary key,
  data jsonb not null,
  status text not null default 'published' check (status in ('draft', 'published')),
  updated_at timestamptz not null default now()
);
create table public.admin_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  entity text not null,
  entity_id text not null,
  action text not null,
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['content_daily_verses','content_plans','content_topics','content_media'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%1$s: read published" on public.%1$I for select using (status = ''published'' or public.is_admin())', t);
    execute format('create policy "%1$s: admin write" on public.%1$I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;
alter table public.admin_audit enable row level security;
create policy "audit: admin read" on public.admin_audit for select using (public.is_admin());
create policy "audit: admin insert" on public.admin_audit for insert with check (public.is_admin() and actor_id = auth.uid());

-------------------------------------------------------------------------------
-- Usage metering and rate limiting (no request content is stored)
-------------------------------------------------------------------------------
create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  requests int not null default 0,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  failures int not null default 0,
  primary key (user_id, day)
);
create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (key, window_start)
);
alter table public.ai_usage enable row level security;
alter table public.rate_limits enable row level security;
create policy "ai_usage: owner read" on public.ai_usage for select using (auth.uid() = user_id);
-- Writes happen only via the service role (bypasses RLS) or the functions below.

-- Atomically consume one unit; returns true when within the limit.
create or replace function public.consume_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  n int;
begin
  insert into public.rate_limits (key, window_start, count) values (p_key, w, 1)
    on conflict (key, window_start) do update set count = public.rate_limits.count + 1
    returning count into n;
  delete from public.rate_limits where window_start < now() - interval '2 days';
  return n <= p_limit;
end $$;
revoke execute on function public.consume_rate_limit(text, int, int) from public, anon, authenticated;

-- Reserve one AI request for today; returns the new count, or -1 when over the limit.
create or replace function public.reserve_ai_request(p_user uuid, p_day date, p_limit int)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into public.ai_usage (user_id, day, requests) values (p_user, p_day, 1)
    on conflict (user_id, day) do update set requests = public.ai_usage.requests + 1
    where public.ai_usage.requests < p_limit
    returning requests into n;
  return coalesce(n, -1);
end $$;
revoke execute on function public.reserve_ai_request(uuid, date, int) from public, anon, authenticated;

create or replace function public.record_ai_result(p_user uuid, p_day date, p_in int, p_out int, p_failed boolean)
returns void language sql security definer set search_path = public as $$
  update public.ai_usage set input_tokens = input_tokens + p_in, output_tokens = output_tokens + p_out,
    failures = failures + case when p_failed then 1 else 0 end
  where user_id = p_user and day = p_day;
$$;
revoke execute on function public.record_ai_result(uuid, date, int, int, boolean) from public, anon, authenticated;
