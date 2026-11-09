-- Server-only lookup used by the sign-up and "resend" flows to decide which
-- email to send: a verification code (new/unverified account) or a sign-in
-- code (already verified account). Supabase intentionally sends nothing when
-- an existing verified address signs up again or asks for a verification
-- resend, which previously left users without any email.
--
-- Only the service role may call this; it is never exposed to browsers.
create or replace function public.auth_email_status(p_email text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when u.id is null then 'none'
    when u.email_confirmed_at is null then 'unconfirmed'
    else 'confirmed'
  end
  from (select 1) as one
  left join auth.users u on lower(u.email) = lower(trim(p_email))
  limit 1;
$$;

revoke execute on function public.auth_email_status(text) from public, anon, authenticated;
grant execute on function public.auth_email_status(text) to service_role;
