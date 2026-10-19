-- Community identities are opt-in and separate from private account profiles.
create table if not exists public.social_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  bio text not null default '' check (char_length(bio) <= 500),
  avatar_url text not null default '' check (char_length(avatar_url) <= 2048 and (avatar_url = '' or avatar_url ~ '^https://')),
  kind text not null default 'volunteer' check (kind in ('volunteer', 'organization'))
);
create table if not exists public.profile_follows (
  follower_id uuid not null references public.social_profiles(id) on delete cascade,
  following_id uuid not null references public.social_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists profile_follows_following_idx on public.profile_follows(following_id, follower_id);
alter table public.social_profiles enable row level security;
alter table public.profile_follows enable row level security;
revoke all on public.social_profiles, public.profile_follows from public, anon, authenticated;
grant select, insert, update, delete on public.social_profiles to authenticated;
grant select, insert, delete on public.profile_follows to authenticated;
drop policy if exists social_read on public.social_profiles;
create policy social_read on public.social_profiles for select to authenticated using (true);
drop policy if exists social_create on public.social_profiles;
create policy social_create on public.social_profiles for insert to authenticated with check (id = (select auth.uid()));
drop policy if exists social_update on public.social_profiles;
create policy social_update on public.social_profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
drop policy if exists social_delete on public.social_profiles;
create policy social_delete on public.social_profiles for delete to authenticated using (id = (select auth.uid()));
drop policy if exists follows_read on public.profile_follows;
create policy follows_read on public.profile_follows for select to authenticated using (true);
drop policy if exists follows_create on public.profile_follows;
create policy follows_create on public.profile_follows for insert to authenticated with check (follower_id = (select auth.uid()));
drop policy if exists follows_delete on public.profile_follows;
create policy follows_delete on public.profile_follows for delete to authenticated using (follower_id = (select auth.uid()));

create or replace view public.community_profiles with (security_invoker = true) as
select p.*,
  (select count(*)::integer from public.profile_follows f where f.following_id = p.id) as followers_count,
  (select count(*)::integer from public.profile_follows f where f.follower_id = p.id) as following_count,
  exists(select 1 from public.profile_follows f where f.following_id = p.id and f.follower_id = (select auth.uid())) as is_following
from public.social_profiles p;
revoke all on public.community_profiles from public, anon, authenticated;
grant select on public.community_profiles to authenticated;

create or replace function public.search_community(
  search_text text default '', profile_kind text default null,
  relation text default null, person_id uuid default null, page_offset integer default 0
) returns setof public.community_profiles
language sql stable security invoker set search_path = '' as $$
  select p.* from public.community_profiles p
  where (search_text = '' or position(lower(left(search_text, 100)) in lower(p.display_name)) > 0)
    and (profile_kind is null or p.kind = profile_kind)
    and (relation is null
      or (relation = 'followers' and exists(select 1 from public.profile_follows f where f.follower_id = p.id and f.following_id = person_id))
      or (relation = 'following' and exists(select 1 from public.profile_follows f where f.following_id = p.id and f.follower_id = person_id)))
  order by p.display_name, p.id limit 24 offset greatest(0, least(page_offset, 100000));
$$;
revoke all on function public.search_community(text, text, text, uuid, integer) from public, anon;
grant execute on function public.search_community(text, text, text, uuid, integer) to authenticated;
