-- Apply after supabase/app.sql on existing installations. Safe to re-run.
-- Counters are private; service-role functions derive limits from the locked profile.
create table if not exists public.ai_question_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  count integer not null default 0 check (count >= 0),
  primary key (user_id, day)
);
create table if not exists public.ai_request_windows (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  count integer not null check (count >= 0)
);
alter table public.ai_question_usage enable row level security;
alter table public.ai_request_windows enable row level security;
revoke all on public.ai_question_usage, public.ai_request_windows from public, anon, authenticated;

create or replace function public.reserve_ai_request(target uuid, request_action text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  p public.profiles%rowtype;
  today date := (now() at time zone 'UTC')::date;
  used integer;
  questions integer;
  daily_limit integer;
  question_limit integer;
  burst_limit integer;
  current_window public.ai_request_windows%rowtype;
begin
  if request_action not in ('questions', 'draft', 'review', 'student_plan', 'student_ask', 'student_fit', 'student_review') then
    raise exception 'BAD_ACTION';
  end if;
  select * into p from public.profiles where id = target for update;
  if not found then raise exception 'PROFILE_REQUIRED'; end if;
  if not p.is_admin then
    if request_action like 'student_%' and not (p.account_type = 'student' and p.plan = 'student') then
      return jsonb_build_object('allowed', false, 'error', 'student_required');
    elsif request_action not like 'student_%' and p.account_type = 'student' then
      return jsonb_build_object('allowed', false, 'error', 'premium_required');
    end if;
  end if;
  daily_limit := case when p.is_admin then 100 when p.plan = 'basic' then 1 else 15 end;
  question_limit := case when p.is_admin then 100 when p.plan = 'basic' then 3 else 30 end;
  burst_limit := case when p.is_admin then 30 else 6 end;
  select count into used from public.ai_usage where user_id = target and day = today;
  used := coalesce(used, 0);
  if used >= daily_limit then
    return jsonb_build_object('allowed', false, 'error', 'daily_limit', 'limit', daily_limit);
  end if;
  if request_action = 'questions' then
    select count into questions from public.ai_question_usage where user_id = target and day = today;
    if coalesce(questions, 0) >= question_limit then
      return jsonb_build_object('allowed', false, 'error', 'question_limit', 'limit', question_limit);
    end if;
  end if;
  select * into current_window from public.ai_request_windows where user_id = target;
  if found and current_window.window_start > now() - interval '1 minute' and current_window.count >= burst_limit then
    return jsonb_build_object('allowed', false, 'error', 'rate_limited', 'retry_after', 60);
  end if;
  insert into public.ai_request_windows(user_id, window_start, count) values (target, now(), 1)
  on conflict (user_id) do update set
    count = case when public.ai_request_windows.window_start <= now() - interval '1 minute' then 1 else public.ai_request_windows.count + 1 end,
    window_start = case when public.ai_request_windows.window_start <= now() - interval '1 minute' then now() else public.ai_request_windows.window_start end;
  if request_action = 'questions' then
    insert into public.ai_question_usage(user_id, day, count) values (target, today, 1)
    on conflict (user_id, day) do update set count = public.ai_question_usage.count + 1;
  else
    insert into public.ai_usage(user_id, day, count) values (target, today, 1)
    on conflict (user_id, day) do update set count = public.ai_usage.count + 1;
    used := used + 1;
  end if;
  return jsonb_build_object('allowed', true, 'remaining', greatest(0, daily_limit - used));
end;
$$;
revoke all on function public.reserve_ai_request(uuid, text) from public, anon, authenticated;
grant execute on function public.reserve_ai_request(uuid, text) to service_role;
-- Retire the old unrestricted increment endpoint after deploying the new handler.
revoke all on function public.bump_ai_usage(uuid) from public, anon, authenticated, service_role;

-- Lock the same profile row before checking counts, including multi-row inserts.
create or replace function public.enforce_saved_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare p public.profiles%rowtype;
begin
  select * into p from public.profiles where id = new.user_id for update;
  if not exists (select 1 from public.opportunities o where o.id = new.opportunity_id
    and (p.is_admin or (o.published and (o.created_at <= now() - interval '24 hours' or p.plan in ('premium', 'student'))))) then
    raise exception 'NOT_ALLOWED' using errcode = '42501';
  end if;
  if p.plan = 'basic' and (select count(*) from public.saved_opportunities where user_id = new.user_id) >= 3 then
    raise exception 'FREE_LIMIT_REACHED' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create or replace function public.enforce_saved_search_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform id from public.profiles where id = new.user_id for update;
  if (select count(*) from public.saved_searches where user_id = new.user_id) >= 10 then
    raise exception 'SEARCH_LIMIT' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create or replace function public.enforce_notes_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform id from public.profiles where id = new.user_id for update;
  if (select count(*) from public.notes where user_id = new.user_id) >= 100 then
    raise exception 'NOTES_LIMIT' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
-- Owners cannot change identity/creation columns to bypass quotas or verification.
revoke update on public.saved_opportunities, public.saved_searches, public.notes, public.letters from public, anon, authenticated;
grant update (status, share_contact, checklist, note) on public.saved_opportunities to authenticated;
grant update (name, params, last_seen_at) on public.saved_searches to authenticated;
grant update (body, color, pinned) on public.notes to authenticated;
grant update (content) on public.letters to authenticated;

create table if not exists public.acceptance_verifications (
  user_id uuid not null,
  opportunity_id uuid not null,
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz not null default now(),
  primary key(user_id, opportunity_id),
  foreign key(user_id, opportunity_id) references public.saved_opportunities(user_id, opportunity_id) on delete cascade
);
alter table public.acceptance_verifications enable row level security;
revoke all on public.acceptance_verifications from public, anon, authenticated;
grant select on public.acceptance_verifications to authenticated;
drop policy if exists "admins read verifications" on public.acceptance_verifications;
create policy "admins read verifications" on public.acceptance_verifications
  for select to authenticated using (public.is_admin());

create or replace function public.reset_acceptance_verification()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    delete from public.acceptance_verifications where user_id = old.user_id and opportunity_id = old.opportunity_id;
    new.share_contact := false;
  end if;
  return new;
end;
$$;
drop trigger if exists reset_acceptance_verification on public.saved_opportunities;
create trigger reset_acceptance_verification before update on public.saved_opportunities
  for each row execute function public.reset_acceptance_verification();
revoke all on function public.reset_acceptance_verification() from public, anon, authenticated;

create or replace function public.set_acceptance_verified(target_user uuid, target_opp uuid, verified boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN' using errcode = '42501'; end if;
  -- Lock the tracked row so a simultaneous status change cannot retain approval.
  perform 1 from public.saved_opportunities where user_id = target_user and opportunity_id = target_opp and status = 'accepted' for update;
  if not found then raise exception 'NOT_ACCEPTED'; end if;
  if verified then
    insert into public.acceptance_verifications(user_id, opportunity_id, verified_by)
      values (target_user, target_opp, auth.uid())
      on conflict (user_id, opportunity_id) do update set verified_by = excluded.verified_by, verified_at = now();
  else
    delete from public.acceptance_verifications where user_id = target_user and opportunity_id = target_opp;
  end if;
end;
$$;
revoke all on function public.set_acceptance_verified(uuid, uuid, boolean) from public, anon;
grant execute on function public.set_acceptance_verified(uuid, uuid, boolean) to authenticated;

create or replace function public.list_acceptance_requests()
returns table(user_id uuid, opportunity_id uuid, title text, full_name text, email text, verified boolean)
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN' using errcode = '42501'; end if;
  return query select s.user_id, s.opportunity_id, o.title, p.full_name, p.email, (v.user_id is not null)
    from public.saved_opportunities s join public.profiles p on p.id = s.user_id
    join public.opportunities o on o.id = s.opportunity_id
    left join public.acceptance_verifications v on v.user_id = s.user_id and v.opportunity_id = s.opportunity_id
    where s.status = 'accepted' order by s.updated_at desc;
end;
$$;
revoke all on function public.list_acceptance_requests() from public, anon;
grant execute on function public.list_acceptance_requests() to authenticated;

create or replace function public.accepted_peers(opp uuid)
returns table(full_name text, email text, avatar_url text, headline text, country text)
language sql stable security definer set search_path = '' as $$
  select p.full_name, p.email, p.avatar_url, p.headline, p.country
  from public.saved_opportunities s join public.profiles p on p.id = s.user_id
  join public.acceptance_verifications v on v.user_id = s.user_id and v.opportunity_id = s.opportunity_id
  where s.opportunity_id = opp and s.status = 'accepted' and s.share_contact and s.user_id <> auth.uid()
    and exists (select 1 from public.saved_opportunities me
      join public.acceptance_verifications mv on mv.user_id = me.user_id and mv.opportunity_id = me.opportunity_id
      where me.user_id = auth.uid() and me.opportunity_id = opp and me.status = 'accepted' and me.share_contact)
  order by s.updated_at;
$$;
revoke all on function public.accepted_peers(uuid) from public, anon;
grant execute on function public.accepted_peers(uuid) to authenticated;
