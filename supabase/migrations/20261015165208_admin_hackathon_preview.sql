-- Hackathons are a separate catalogue. All access is admin-only during preview.
create table if not exists public.hackathons (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 160),
  organizer text not null check (char_length(trim(organizer)) between 1 and 160),
  format text not null check (format in ('online', 'onsite', 'hybrid')),
  location text not null default '' check (char_length(location) <= 200),
  deadline date not null,
  start_date date not null,
  end_date date not null,
  team_min integer not null default 1,
  team_max integer not null default 5,
  prize text not null default '' check (char_length(prize) <= 200),
  technologies text[] not null default '{}',
  themes text[] not null default '{}',
  level text not null default 'all' check (level in ('all', 'beginner', 'experienced')),
  eligibility text not null default '' check (char_length(eligibility) <= 3000),
  description text not null check (char_length(trim(description)) between 1 and 12000),
  url text not null check (url ~* '^https?://[^[:space:]]+$' and char_length(url) <= 2000),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  constraint hackathon_dates check (deadline <= start_date and start_date <= end_date),
  constraint hackathon_team check (team_min >= 1 and team_max >= team_min and team_max <= 100),
  constraint hackathon_location check (format = 'online' or char_length(trim(location)) > 0),
  constraint hackathon_tags check (cardinality(technologies) <= 30 and cardinality(themes) <= 20)
);
create index if not exists hackathons_deadline_idx on public.hackathons(deadline);
alter table public.hackathons enable row level security;
revoke all on public.hackathons from public, anon, authenticated;
grant select, insert, update, delete on public.hackathons to authenticated;
grant all on public.hackathons to service_role;
drop policy if exists hackathons_admin_only on public.hackathons;
create policy hackathons_admin_only on public.hackathons for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create table if not exists public.hackathon_entries (
  user_id uuid not null references public.profiles(id) on delete cascade,
  hackathon_id uuid not null references public.hackathons(id) on delete cascade,
  stage text not null default 'saved' check (stage in ('saved', 'forming_team', 'registered', 'submitted')),
  primary key (user_id, hackathon_id)
);
create index if not exists hackathon_entries_hackathon_idx on public.hackathon_entries(hackathon_id);
alter table public.hackathon_entries enable row level security;
revoke all on public.hackathon_entries from public, anon, authenticated;
grant select, insert, update, delete on public.hackathon_entries to authenticated;
grant all on public.hackathon_entries to service_role;
drop policy if exists hackathon_entries_admin_own on public.hackathon_entries;
create policy hackathon_entries_admin_own on public.hackathon_entries for all to authenticated
  using ((select public.is_admin()) and user_id = (select auth.uid()))
  with check ((select public.is_admin()) and user_id = (select auth.uid()));
