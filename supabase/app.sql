-- Openly app schema: profiles, opportunities, saved/tracked opportunities.
-- Run in Supabase: SQL Editor → New query → paste → Run. Safe to re-run.
--
-- After your first sign-up, make yourself an admin:
--   update public.profiles set is_admin = true where email = 'you@example.com';
-- Make someone Premium (or use Admin → Users in the app):
--   update public.profiles set plan = 'premium' where email = 'them@example.com';

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
  values (
    new.id,
    new.email,
    -- Email sign-up sends full_name; Google sends full_name and/or name.
    coalesce(left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 80), '')
  )
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

-- Email notification settings (see jobs/notify.mjs).
alter table public.profiles add column if not exists digest_opt_out boolean not null default false;
alter table public.profiles add column if not exists reminders_opt_out boolean not null default false;
alter table public.profiles add column if not exists last_digest_at timestamptz;
-- Free-text background (education, experience, skills) used by the AI assistant.
alter table public.profiles add column if not exists about text not null default '' check (char_length(about) <= 2000);

-- Admins switch a user's plan from /admin/users. Users can't change their own
-- plan: the column isn't in the grant below and this function checks is_admin().
create or replace function public.set_user_plan(target uuid, new_plan text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN' using errcode = '42501';
  end if;
  if new_plan not in ('basic', 'premium') then
    raise exception 'BAD_PLAN';
  end if;
  update public.profiles set plan = new_plan where id = target;
end;
$$;
revoke all on function public.set_user_plan(uuid, text) from public, anon;
grant execute on function public.set_user_plan(uuid, text) to authenticated;

-- Users may only edit these columns; plan and is_admin are set by an admin.
revoke update on public.profiles from authenticated, anon;
grant update (full_name, interests, country, digest_opt_out, reminders_opt_out, about) on public.profiles to authenticated;

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

create or replace function public.is_premium()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select plan = 'premium' from public.profiles where id = auth.uid()), false);
$$;

-- Premium early access: new opportunities are visible to Premium users (and
-- admins) right away, to everyone else 24 hours after they are published.
drop policy if exists "read published opportunities" on public.opportunities;
create policy "read published opportunities" on public.opportunities
  for select to anon, authenticated using (
    public.is_admin()
    or (published and (created_at <= now() - interval '24 hours' or public.is_premium()))
  );

-- How many opportunities are currently in the Premium-only 24h window
-- (shown to free users as "Premium users already see N new opportunities").
create or replace function public.premium_early_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int from public.opportunities
  where published and created_at > now() - interval '24 hours' and deadline >= current_date;
$$;
grant execute on function public.premium_early_count() to anon, authenticated;

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

-- ---------------------------------------------------------------------------
-- Email log: one row per notification sent, so a re-run never double-sends.
-- Only the notification job (service role) touches it; no policies = no access
-- for anon/authenticated.
-- ---------------------------------------------------------------------------
create table if not exists public.email_log (
  user_id  uuid not null references auth.users (id) on delete cascade,
  kind     text not null check (kind in ('digest', 'reminder')),
  ref      text not null,  -- digest: YYYY-MM-DD; reminder: <opportunity id>:<days before>
  sent_at  timestamptz not null default now(),
  primary key (user_id, kind, ref)
);

alter table public.email_log enable row level security;

-- ---------------------------------------------------------------------------
-- AI usage counter (Premium AI assistant, see supabase/functions/ai).
-- Written only by the edge function with the service role; no policies.
-- ---------------------------------------------------------------------------
create table if not exists public.ai_usage (
  user_id  uuid not null references auth.users (id) on delete cascade,
  day      date not null default current_date,
  count    int  not null default 0,
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;

-- Atomically counts one AI request; returns the new total for today.
create or replace function public.bump_ai_usage(target uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.ai_usage (user_id, day, count) values (target, current_date, 1)
  on conflict (user_id, day) do update set count = public.ai_usage.count + 1
  returning count;
$$;
revoke all on function public.bump_ai_usage(uuid) from public, anon, authenticated;
