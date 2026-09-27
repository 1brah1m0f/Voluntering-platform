-- Waitlist table for the Openly landing page.
-- Run in Supabase: SQL Editor → New query → paste → Run.

create extension if not exists citext;

create table if not exists public.waitlist (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  name            text not null check (char_length(name) between 1 and 80),
  email           citext not null unique check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  plan            text not null default 'basic' check (plan in ('basic', 'premium')),
  lang            text check (lang in ('az', 'en')),
  user_agent      text check (char_length(user_agent) <= 300)
);

-- Upgrading a table created by an older version of this file:
alter table public.waitlist add column if not exists plan text not null default 'basic' check (plan in ('basic', 'premium'));

alter table public.waitlist enable row level security;

-- Anonymous visitors may only INSERT. No select/update/delete policies exist,
-- so nobody can read the list with the public anon key.
drop policy if exists "anon can join waitlist" on public.waitlist;
create policy "anon can join waitlist"
  on public.waitlist for insert
  to anon, authenticated
  with check (true);

drop function if exists public.waitlist_count();

-- Handy views for market-research analysis (run as project owner in SQL editor):
--   select plan, count(*) from waitlist group by 1;
