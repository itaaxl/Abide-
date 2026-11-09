-- Short "Reflection" line shown on verse cards (editorial, not Scripture).
alter table public.content_daily_verses
  add column if not exists phrase text check (char_length(phrase) <= 140);
