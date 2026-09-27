-- Waitlist table for the Fürsət landing page.
-- Run in Supabase: SQL Editor → New query → paste → Run.

create extension if not exists citext;

create table if not exists public.waitlist (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  name            text check (char_length(name) <= 80),
  email           citext not null unique check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  interests       text[] not null default '{}',
  country         text check (char_length(country) <= 32),
  applied_before  text check (applied_before in ('yes', 'no', 'planning')),
  would_pay       text check (would_pay in ('yes', 'maybe', 'no')),
  lang            text check (lang in ('az', 'en')),
  user_agent      text check (char_length(user_agent) <= 300)
);

alter table public.waitlist enable row level security;

-- Anonymous visitors may only INSERT. No select/update/delete policies exist,
-- so nobody can read the list with the public anon key.
drop policy if exists "anon can join waitlist" on public.waitlist;
create policy "anon can join waitlist"
  on public.waitlist for insert
  to anon, authenticated
  with check (true);

-- Public counter ("X nəfər artıq qoşulub") without exposing any rows.
create or replace function public.waitlist_count()
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::int from public.waitlist;
$$;

revoke all on function public.waitlist_count() from public;
grant execute on function public.waitlist_count() to anon, authenticated;

-- Handy views for market-research analysis (run as project owner in SQL editor):
--   select would_pay, count(*) from waitlist group by 1;
--   select applied_before, count(*) from waitlist group by 1;
--   select unnest(interests) as interest, count(*) from waitlist group by 1 order by 2 desc;
