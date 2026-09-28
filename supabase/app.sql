-- Openly app schema: profiles, opportunities, saved/tracked opportunities.
-- Run in Supabase: SQL Editor → New query → paste → Run. Safe to re-run.
--
-- After your first sign-up, make yourself an admin:
--   update public.profiles set is_admin = true where email = 'you@example.com';

-- ---------------------------------------------------------------------------
-- Profiles (one row per auth user, created automatically on sign-up)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text not null default '' check (char_length(full_name) <= 80),
  interests   text[] not null default '{}',
  country     text not null default '' check (char_length(country) <= 60),
  plan        text not null default 'basic' check (plan in ('basic', 'premium')),
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(left(new.raw_user_meta_data ->> 'full_name', 80), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Users may only edit these columns; plan and is_admin are set by an admin in SQL.
revoke update on public.profiles from authenticated, anon;
grant update (full_name, interests, country) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Opportunities (managed from /admin)
-- ---------------------------------------------------------------------------
create table if not exists public.opportunities (
  id             uuid primary key default gen_random_uuid(),
  title          text not null check (char_length(title) between 3 and 160),
  program        text not null check (char_length(program) <= 60),
  organizer      text not null default '' check (char_length(organizer) <= 120),
  kind           text not null default 'volunteering'
                   check (kind in ('youth_exchange', 'training', 'volunteering', 'seminar', 'online', 'other')),
  country        text not null default '' check (char_length(country) <= 60),
  city           text not null default '' check (char_length(city) <= 60),
  is_online      boolean not null default false,
  interests      text[] not null default '{}',
  deadline       date not null,
  start_date     date,
  end_date       date,
  costs          text not null default 'unknown' check (costs in ('full', 'partial', 'none', 'unknown')),
  url            text not null check (url ~ '^https?://'),
  description    text not null default '' check (char_length(description) <= 5000),
  published      boolean not null default true,
  created_by     uuid references auth.users (id) on delete set null default auth.uid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists opportunities_deadline_idx on public.opportunities (deadline);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists opportunities_touch on public.opportunities;
create trigger opportunities_touch before update on public.opportunities
  for each row execute function public.touch_updated_at();

alter table public.opportunities enable row level security;

drop policy if exists "read published opportunities" on public.opportunities;
create policy "read published opportunities" on public.opportunities
  for select to anon, authenticated using (published or public.is_admin());

drop policy if exists "admins manage opportunities" on public.opportunities;
create policy "admins manage opportunities" on public.opportunities
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Saved / tracked opportunities
-- ---------------------------------------------------------------------------
create table if not exists public.saved_opportunities (
  user_id         uuid not null references auth.users (id) on delete cascade default auth.uid(),
  opportunity_id  uuid not null references public.opportunities (id) on delete cascade,
  status          text not null default 'saved' check (status in ('saved', 'applied', 'accepted', 'rejected')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

drop trigger if exists saved_touch on public.saved_opportunities;
create trigger saved_touch before update on public.saved_opportunities
  for each row execute function public.touch_updated_at();

-- Free plan: at most 3 tracked opportunities at a time.
create or replace function public.enforce_saved_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_plan text;
  n int;
begin
  select plan into user_plan from public.profiles where id = new.user_id;
  if coalesce(user_plan, 'basic') = 'basic' then
    select count(*) into n from public.saved_opportunities where user_id = new.user_id;
    if n >= 3 then
      raise exception 'FREE_LIMIT_REACHED' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists saved_limit on public.saved_opportunities;
create trigger saved_limit before insert on public.saved_opportunities
  for each row execute function public.enforce_saved_limit();

alter table public.saved_opportunities enable row level security;

drop policy if exists "own saved rows" on public.saved_opportunities;
create policy "own saved rows" on public.saved_opportunities
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
