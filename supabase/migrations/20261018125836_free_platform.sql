-- All platform features are free. Existing plan values remain compatible.
drop policy if exists "read published opportunities" on public.opportunities;
create policy "read published opportunities" on public.opportunities
  for select to anon, authenticated using (published or public.is_admin());
create or replace function public.is_student()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select account_type = 'student' or is_admin from public.profiles where id = auth.uid()), false);
$$;
create or replace function public.enforce_saved_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform id from public.profiles where id = new.user_id for update;
  if not exists (select 1 from public.opportunities o where o.id = new.opportunity_id
    and (public.is_admin() or o.published)) then
    raise exception 'NOT_ALLOWED' using errcode = '42501';
  end if;
  return new;
end;
$$;
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
    if request_action like 'student_%' and not (p.account_type = 'student') then
      return jsonb_build_object('allowed', false, 'error', 'student_required');
    elsif request_action not like 'student_%' and p.account_type = 'student' then
      return jsonb_build_object('allowed', false, 'error', 'premium_required');
    end if;
  end if;
  daily_limit := 10;
  question_limit := 10;
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
  end if;
  insert into public.ai_usage(user_id, day, count) values (target, today, 1)
    on conflict (user_id, day) do update set count = public.ai_usage.count + 1;
  used := used + 1;
  return jsonb_build_object('allowed', true, 'remaining', greatest(0, daily_limit - used));
end;
$$;
revoke all on function public.reserve_ai_request(uuid, text) from public, anon, authenticated;
grant execute on function public.reserve_ai_request(uuid, text) to service_role;
-- Keep the legacy RPC available for older clients; no delayed opportunities remain.
create or replace function public.premium_early_count()
returns integer language sql stable as $$ select 0; $$;
-- Old plan values remain for compatibility; no longer send activation notices.
create or replace function private.notify_plan_activation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  return new;
end;
$$;
