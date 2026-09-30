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
  plan        text not null default 'basic' check (plan in ('basic', 'premium', 'student')),
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
  -- Google sign-up: use the Google picture as the profile photo. Separate statement
  -- so sign-up still works before the avatar_url column exists.
  begin
    update public.profiles set avatar_url = new.raw_user_meta_data ->> 'avatar_url'
    where id = new.id
      and char_length(new.raw_user_meta_data ->> 'avatar_url') <= 500
      and new.raw_user_meta_data ->> 'avatar_url' ~ '^https://';
  exception when undefined_column then null;
  end;
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
-- Personalisation: profile photo (Storage "avatars" bucket or the Google picture) and a one-line headline.
alter table public.profiles add column if not exists avatar_url text not null default ''
  check (char_length(avatar_url) <= 500 and (avatar_url = '' or avatar_url ~ '^https://'));
alter table public.profiles add column if not exists headline text not null default '' check (char_length(headline) <= 80);

-- Existing Google users: start with their Google picture.
update public.profiles p set avatar_url = u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
where p.id = u.id and p.avatar_url = ''
  and char_length(u.raw_user_meta_data ->> 'avatar_url') <= 500 and u.raw_user_meta_data ->> 'avatar_url' ~ '^https://';

-- Plans: basic (free), premium (3 ₼), student (7 ₼: everything in Premium plus the student section).
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check check (plan in ('basic', 'premium', 'student'));
-- Student roadmap: ids of the steps the user has ticked (see src/app/student/roadmap.ts).
alter table public.profiles add column if not exists roadmap text[] not null default '{}' check (cardinality(roadmap) <= 50);

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
  if new_plan not in ('basic', 'premium', 'student') then
    raise exception 'BAD_PLAN';
  end if;
  update public.profiles set plan = new_plan where id = target;
end;
$$;
revoke all on function public.set_user_plan(uuid, text) from public, anon;
grant execute on function public.set_user_plan(uuid, text) to authenticated;

-- A Premium user can cancel their own Premium (back to the free plan).
create or replace function public.cancel_premium()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set plan = 'basic' where id = auth.uid();
$$;
revoke all on function public.cancel_premium() from public, anon;
grant execute on function public.cancel_premium() to authenticated;

-- Users may only edit these columns; plan and is_admin are set by an admin.
revoke update on public.profiles from authenticated, anon;
grant update (full_name, interests, country, digest_opt_out, reminders_opt_out, about, avatar_url, headline, roadmap) on public.profiles to authenticated;

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

-- Youth exchanges are applied to through a partner ("sending") organisation in Azerbaijan.
alter table public.opportunities add column if not exists sending_org text not null default '' check (char_length(sending_org) <= 120);
alter table public.opportunities add column if not exists sending_org_contact text not null default '' check (char_length(sending_org_contact) <= 200);

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
  -- Student includes everything in Premium.
  select coalesce((select plan in ('premium', 'student') from public.profiles where id = auth.uid()), false);
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

-- ---------------------------------------------------------------------------
-- Profile photos: public "avatars" bucket, each user writes only <their id>/...
-- (the app uploads a 256px JPEG and stores its public URL in profiles.avatar_url).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars: read own" on storage.objects;
create policy "avatars: read own" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars: upload own" on storage.objects;
create policy "avatars: upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars: delete own" on storage.objects;
create policy "avatars: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Saved motivation letters: one per user per opportunity (AI assistant tab).
-- ---------------------------------------------------------------------------
create table if not exists public.letters (
  user_id         uuid not null references auth.users (id) on delete cascade default auth.uid(),
  opportunity_id  uuid not null references public.opportunities (id) on delete cascade,
  content         text not null check (char_length(content) <= 12000),
  updated_at      timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

drop trigger if exists letters_touch on public.letters;
create trigger letters_touch before update on public.letters
  for each row execute function public.touch_updated_at();

alter table public.letters enable row level security;

drop policy if exists "own letters" on public.letters;
create policy "own letters" on public.letters
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Accepted participants: people accepted to the same opportunity can see each
-- other's contact details — only if both have chosen to share (opt-in, per
-- opportunity). Status is self-reported, so sharing is never on by default.
-- ---------------------------------------------------------------------------
alter table public.saved_opportunities add column if not exists share_contact boolean not null default false;

-- Application prep per tracked opportunity: ticked checklist items (see src/app/checklist.ts) and a private note.
alter table public.saved_opportunities add column if not exists checklist text[] not null default '{}' check (cardinality(checklist) <= 20);
alter table public.saved_opportunities add column if not exists note text not null default '' check (char_length(note) <= 1000);

create or replace function public.accepted_peers(opp uuid)
returns table (full_name text, email text, avatar_url text, headline text, country text)
language sql
stable
security definer
set search_path = public
as $$
  select p.full_name, p.email, p.avatar_url, p.headline, p.country
  from public.saved_opportunities s
  join public.profiles p on p.id = s.user_id
  where s.opportunity_id = opp
    and s.status = 'accepted' and s.share_contact
    and s.user_id <> auth.uid()
    -- the caller must be accepted and sharing too
    and exists (
      select 1 from public.saved_opportunities me
      where me.user_id = auth.uid() and me.opportunity_id = opp and me.status = 'accepted' and me.share_contact
    )
  order by s.updated_at;
$$;
revoke all on function public.accepted_peers(uuid) from public, anon;
grant execute on function public.accepted_peers(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Saved searches: a name plus the list's filter URL parameters. The dashboard
-- shows how many opportunities match and how many are new since last opened.
-- ---------------------------------------------------------------------------
create table if not exists public.saved_searches (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name          text not null check (char_length(name) between 1 and 60),
  params        text not null check (char_length(params) <= 500),
  last_seen_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists saved_searches_user_idx on public.saved_searches (user_id);

alter table public.saved_searches enable row level security;

drop policy if exists "own saved searches" on public.saved_searches;
create policy "own saved searches" on public.saved_searches
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- At most 10 per user.
create or replace function public.enforce_saved_search_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.saved_searches where user_id = new.user_id) >= 10 then
    raise exception 'SEARCH_LIMIT' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists saved_search_limit on public.saved_searches;
create trigger saved_search_limit before insert on public.saved_searches
  for each row execute function public.enforce_saved_search_limit();

-- ---------------------------------------------------------------------------
-- Student section (Student plan, 7 ₼): scholarships and universities.
-- Readable only by Student-plan users and admins — enforced here, not just in
-- the app. Content comes from supabase/seed-student.sql; admins can edit rows.
-- ---------------------------------------------------------------------------
create or replace function public.is_student()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select plan = 'student' or is_admin from public.profiles where id = auth.uid()), false);
$$;

create table if not exists public.scholarships (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) <= 160),
  provider      text not null default '' check (char_length(provider) <= 160),
  country       text not null default '' check (char_length(country) <= 60),
  levels        text[] not null default '{}',   -- bachelor, master, phd
  fields        text[] not null default '{}',   -- empty = any field
  coverage      text not null default '' check (char_length(coverage) <= 600),
  deadline      date,                           -- next known deadline, if announced
  deadline_note text not null default '' check (char_length(deadline_note) <= 200),
  eligibility   text not null default '' check (char_length(eligibility) <= 1000),
  how_to_apply  text not null default '' check (char_length(how_to_apply) <= 1000),
  url           text not null check (url ~ '^https?://'),
  sort          int not null default 100,
  updated_at    timestamptz not null default now()
);

create table if not exists public.universities (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(name) <= 160),
  country          text not null check (char_length(country) <= 60),
  city             text not null default '' check (char_length(city) <= 60),
  fields           text[] not null default '{}',
  levels           text[] not null default '{}',
  language         text not null default '' check (char_length(language) <= 60),
  tuition_min_eur  int,                          -- per year, estimate
  tuition_max_eur  int,
  tuition_note     text not null default '' check (char_length(tuition_note) <= 300),
  living_eur_month int,
  app_fee_eur      int,                          -- 0 = no fee, null = unknown
  app_fee_note     text not null default '' check (char_length(app_fee_note) <= 300),
  min_ielts        numeric(2, 1),
  exams            text not null default '' check (char_length(exams) <= 200),
  requirements     text not null default '' check (char_length(requirements) <= 1000),
  deadline_note    text not null default '' check (char_length(deadline_note) <= 200),
  scholarships_note text not null default '' check (char_length(scholarships_note) <= 400),
  url              text not null check (url ~ '^https?://'),
  sort             int not null default 100,
  updated_at       timestamptz not null default now()
);

alter table public.scholarships enable row level security;
alter table public.universities enable row level security;

drop policy if exists "students read scholarships" on public.scholarships;
create policy "students read scholarships" on public.scholarships for select to authenticated using (public.is_student());
drop policy if exists "admins manage scholarships" on public.scholarships;
create policy "admins manage scholarships" on public.scholarships for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "students read universities" on public.universities;
create policy "students read universities" on public.universities for select to authenticated using (public.is_student());
drop policy if exists "admins manage universities" on public.universities;
create policy "admins manage universities" on public.universities for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- What's inside, for the paywall page ("12 scholarships, 11 universities").
create or replace function public.student_catalog_counts()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'scholarships', (select count(*) from public.scholarships),
    'universities', (select count(*) from public.universities)
  );
$$;
grant execute on function public.student_catalog_counts() to anon, authenticated;

-- Universities a student is considering, with their own application status.
create table if not exists public.student_shortlist (
  user_id        uuid not null references auth.users (id) on delete cascade default auth.uid(),
  university_id  uuid not null references public.universities (id) on delete cascade,
  status         text not null default 'planning' check (status in ('planning', 'applied', 'accepted', 'rejected')),
  created_at     timestamptz not null default now(),
  primary key (user_id, university_id)
);

alter table public.student_shortlist enable row level security;

drop policy if exists "own shortlist" on public.student_shortlist;
create policy "own shortlist" on public.student_shortlist
  for all to authenticated using (user_id = auth.uid() and public.is_student()) with check (user_id = auth.uid() and public.is_student());

-- ---------------------------------------------------------------------------
-- Student section, v2: English text, structured facts and saved scholarships.
-- ---------------------------------------------------------------------------
-- English versions of the text columns ({"coverage": "...", ...}); the app falls
-- back to the Azerbaijani column when a key is missing.
alter table public.scholarships add column if not exists en jsonb not null default '{}';
alter table public.universities add column if not exists en jsonb not null default '{}';

-- What a scholarship pays for, shown as chips on its card.
alter table public.scholarships add column if not exists covers text[] not null default '{}'
  check (covers <@ array['tuition', 'stipend', 'housing', 'flights', 'insurance', 'language']::text[]);
alter table public.scholarships add column if not exists funding text check (funding in ('full', 'partial'));

-- The usual application window as months (1–12), when the official page names them.
-- `deadline` stays the exact date once it is announced.
alter table public.scholarships add column if not exists opens_month smallint check (opens_month between 1 and 12);
alter table public.scholarships add column if not exists closes_month smallint check (closes_month between 1 and 12);
alter table public.universities add column if not exists closes_month smallint check (closes_month between 1 and 12);

-- The student's level, field, IELTS and yearly budget ("My plan"), used to
-- mark scholarships and universities that fit.
alter table public.profiles add column if not exists student_prefs jsonb not null default '{}'
  check (jsonb_typeof(student_prefs) = 'object' and pg_column_size(student_prefs) <= 1000);
grant update (student_prefs) on public.profiles to authenticated;

-- Scholarships a student has saved, with their own application status.
create table if not exists public.student_saved_scholarships (
  user_id        uuid not null references auth.users (id) on delete cascade default auth.uid(),
  scholarship_id uuid not null references public.scholarships (id) on delete cascade,
  status         text not null default 'planning' check (status in ('planning', 'applied', 'accepted', 'rejected')),
  created_at     timestamptz not null default now(),
  primary key (user_id, scholarship_id)
);

alter table public.student_saved_scholarships enable row level security;

drop policy if exists "own saved scholarships" on public.student_saved_scholarships;
create policy "own saved scholarships" on public.student_saved_scholarships
  for all to authenticated using (user_id = auth.uid() and public.is_student()) with check (user_id = auth.uid() and public.is_student());
