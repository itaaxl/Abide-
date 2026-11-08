-- Row-level security tests with two users (A and B).
-- Run with: npm run test:db   (see scripts/test-db.sh)
\set ON_ERROR_STOP on
\set A '''aaaaaaaa-0000-0000-0000-000000000001'''
\set B '''bbbbbbbb-0000-0000-0000-000000000002'''

insert into auth.users (id, email, email_confirmed_at) values (:A, 'a@example.test', now()), (:B, 'b@example.test', now());

create or replace function pg_temp.expect(cond boolean, label text) returns void language plpgsql as $$
begin
  if not cond then raise exception 'FAIL: %', label; end if;
  raise notice 'PASS: %', label;
end $$;

-- Profiles are created by trigger.
select pg_temp.expect((select count(*) from public.profiles) = 2, 'profiles auto-created for new users');

------------------------------------------------------------------ user A writes
set role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', false);

insert into public.bookmarks (edition, book, chapter, verse_start, verse_end) values ('eng-web', 'JHN', 3, 16, 16);
insert into public.highlights (edition, book, chapter, verse, color) values ('eng-web', 'JHN', 3, 16, 'yellow');
insert into public.notes (edition, book, chapter, verse_start, verse_end, body) values ('eng-web', 'JHN', 3, 16, 16, 'A private note');
insert into public.prayer_entries (title, body) values ('Private prayer', 'Something personal');
insert into public.decks (name) values ('A deck');
insert into public.cards (deck_id, kind, edition, book, chapter, verse_start, verse_end)
  select id, 'ref_to_text', 'eng-web', 'JHN', 3, 16, 16 from public.decks;
insert into public.saved_guidance (request_text, edition, response) values ('private request', 'eng-web', '{}');
insert into public.plan_enrollments (plan_slug, edition) values ('gospel-of-john', 'eng-web');

select pg_temp.expect((select count(*) from public.bookmarks) = 1, 'A sees own bookmark');

-- Duplicate-sensitive uniqueness
do $$ begin
  insert into public.bookmarks (edition, book, chapter, verse_start, verse_end) values ('eng-web', 'JHN', 3, 16, 16);
  raise exception 'FAIL: duplicate bookmark allowed';
exception when unique_violation then raise notice 'PASS: duplicate bookmark rejected';
end $$;
do $$ begin
  insert into public.cards (deck_id, kind, edition, book, chapter, verse_start, verse_end)
    select id, 'ref_to_text', 'eng-web', 'JHN', 3, 16, 16 from public.decks;
  raise exception 'FAIL: duplicate passage card allowed';
exception when unique_violation then raise notice 'PASS: duplicate passage card rejected';
end $$;

-- Role escalation is impossible
do $$ begin
  update public.profiles set role = 'admin' where id = auth.uid();
  raise exception 'FAIL: user changed own role';
exception when insufficient_privilege then raise notice 'PASS: user cannot change own role';
end $$;
select pg_temp.expect(not public.is_admin(), 'A is not admin');

------------------------------------------------------------------ user B attacks
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000002', false);

select pg_temp.expect((select count(*) from public.bookmarks) = 0, 'B cannot read A bookmarks');
select pg_temp.expect((select count(*) from public.highlights) = 0, 'B cannot read A highlights');
select pg_temp.expect((select count(*) from public.notes) = 0, 'B cannot read A notes');
select pg_temp.expect((select count(*) from public.prayer_entries) = 0, 'B cannot read A journal');
select pg_temp.expect((select count(*) from public.cards) = 0, 'B cannot read A cards');
select pg_temp.expect((select count(*) from public.decks) = 0, 'B cannot read A decks');
select pg_temp.expect((select count(*) from public.saved_guidance) = 0, 'B cannot read A saved guidance');
select pg_temp.expect((select count(*) from public.plan_enrollments) = 0, 'B cannot read A plan enrollments');
select pg_temp.expect((select count(*) from public.profiles) = 1, 'B sees only own profile');

-- Guessed identifiers: updates/deletes silently affect zero rows.
with u as (update public.notes set body = 'hacked' returning 1) select pg_temp.expect((select count(*) from u) = 0, 'B cannot update A note');
with d as (delete from public.prayer_entries returning 1) select pg_temp.expect((select count(*) from d) = 0, 'B cannot delete A journal entry');
with d as (delete from public.bookmarks returning 1) select pg_temp.expect((select count(*) from d) = 0, 'B cannot delete A bookmark');

-- Inserting rows owned by someone else is rejected.
do $$ begin
  insert into public.notes (user_id, edition, book, chapter, verse_start, verse_end, body)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 'eng-web', 'JHN', 1, 1, 1, 'spoof');
  raise exception 'FAIL: B inserted a row for A';
exception when insufficient_privilege then raise notice 'PASS: B cannot insert rows owned by A';
end $$;

-- B cannot attach a card to A's deck (ownership trigger), even knowing the id.
do $$
declare a_deck uuid;
begin
  reset role;
  select id into a_deck from public.decks limit 1;
  set role authenticated;
  perform set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000002', false);
  insert into public.cards (deck_id, kind, front, back) values (a_deck, 'custom', 'q', 'a');
  raise exception 'FAIL: B attached a card to A deck';
exception when raise_exception then
  if sqlerrm like 'FAIL%' then raise; end if;
  raise notice 'PASS: B cannot add cards to A deck';
end $$;

-- record_review cannot touch another user's card.
do $$
declare a_card uuid; r jsonb;
begin
  reset role;
  select id into a_card from public.cards limit 1;
  set role authenticated;
  perform set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000002', false);
  r := public.record_review(a_card, gen_random_uuid(), 'good', 0, 1, 2.5, 1, 0, now() + interval '1 day');
  if r->>'status' <> 'not_found' then raise exception 'FAIL: B reviewed A card: %', r; end if;
  raise notice 'PASS: B cannot review A card';
end $$;

-- Privileged functions are not callable by end users.
do $$ begin
  perform public.consume_rate_limit('x', 1, 60);
  raise exception 'FAIL: user called consume_rate_limit';
exception when insufficient_privilege then raise notice 'PASS: rate limit function not exposed to users';
end $$;
do $$ begin
  perform public.reserve_ai_request('bbbbbbbb-0000-0000-0000-000000000002', current_date, 1000);
  raise exception 'FAIL: user reserved AI quota directly';
exception when insufficient_privilege then raise notice 'PASS: AI quota function not exposed to users';
end $$;

-- Curated content: drafts hidden from non-admins; non-admins cannot write.
reset role;
insert into public.content_plans (slug, data, status) values ('draft-plan', '{}', 'draft'), ('pub-plan', '{}', 'published');
set role authenticated;
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000002', false);
select pg_temp.expect((select count(*) from public.content_plans) = 1, 'non-admin sees only published content');
do $$ begin
  insert into public.content_plans (slug, data) values ('evil', '{}');
  raise exception 'FAIL: non-admin wrote content';
exception when insufficient_privilege then raise notice 'PASS: non-admin cannot write content';
end $$;

-- Anonymous visitors see public Scripture tables but no private data.
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select pg_temp.expect((select count(*) from public.bookmarks) = 0, 'anon cannot read bookmarks');
select pg_temp.expect((select count(*) from public.content_plans) = 1, 'anon sees published content');

------------------------------------------------------------------ reviews: idempotency and concurrency
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', false);
do $$
declare c uuid; req uuid := gen_random_uuid(); r1 jsonb; r2 jsonb; r3 jsonb;
begin
  select id into c from public.cards limit 1;
  r1 := public.record_review(c, req, 'good', 0, 1, 2.5, 1, 0, now() + interval '1 day');
  r2 := public.record_review(c, req, 'good', 0, 1, 2.5, 1, 0, now() + interval '1 day');
  if r1->>'status' <> 'ok' then raise exception 'FAIL: first review %', r1; end if;
  if r2->>'status' <> 'duplicate' then raise exception 'FAIL: retried review not idempotent %', r2; end if;
  if (select count(*) from public.reviews) <> 1 then raise exception 'FAIL: duplicate review rows'; end if;
  raise notice 'PASS: duplicate review request is idempotent';
  r3 := public.record_review(c, gen_random_uuid(), 'easy', 0, 4, 2.65, 2, 0, now() + interval '4 days');
  if r3->>'status' <> 'conflict' then raise exception 'FAIL: stale version accepted %', r3; end if;
  raise notice 'PASS: stale concurrent review rejected with conflict';
end $$;

------------------------------------------------------------------ deletion cascades
reset role;
delete from auth.users where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select pg_temp.expect((select count(*) from public.bookmarks) + (select count(*) from public.notes) + (select count(*) from public.prayer_entries)
  + (select count(*) from public.cards) + (select count(*) from public.reviews) + (select count(*) from public.saved_guidance) = 0,
  'deleting the auth user removes all application records');

------------------------------------------------------------------ rate limits & quotas (service role)
select pg_temp.expect(public.consume_rate_limit('k', 2, 60) and public.consume_rate_limit('k', 2, 60) and not public.consume_rate_limit('k', 2, 60), 'rate limit enforces limit');
select pg_temp.expect(public.reserve_ai_request('bbbbbbbb-0000-0000-0000-000000000002', current_date, 2) = 1, 'quota reserve 1');
select pg_temp.expect(public.reserve_ai_request('bbbbbbbb-0000-0000-0000-000000000002', current_date, 2) = 2, 'quota reserve 2');
select pg_temp.expect(public.reserve_ai_request('bbbbbbbb-0000-0000-0000-000000000002', current_date, 2) = -1, 'quota exhausted');

\echo 'ALL RLS TESTS PASSED'
