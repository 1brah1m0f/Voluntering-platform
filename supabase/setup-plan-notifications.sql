-- Run this entire file in Supabase SQL Editor. Safe to run again.
begin;

-- Compatibility with older profiles tables where CREATE TABLE IF NOT EXISTS
-- in app.sql does not add newly introduced columns.
alter table public.profiles
  add column if not exists plan text not null default 'basic'
  check (plan in ('basic', 'premium', 'student'));

-- Persist plan activation messages, including grants made directly through SQL.
create table if not exists public.plan_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('premium', 'student')),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists plan_notifications_unread on public.plan_notifications(user_id, created_at) where read_at is null;
alter table public.plan_notifications enable row level security;
revoke all on public.plan_notifications from public, anon, authenticated;
grant select on public.plan_notifications to authenticated;
grant update (read_at) on public.plan_notifications to authenticated;
drop policy if exists plan_notifications_select on public.plan_notifications;
create policy plan_notifications_select on public.plan_notifications for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists plan_notifications_read on public.plan_notifications;
create policy plan_notifications_read on public.plan_notifications for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create schema if not exists private;
create or replace function private.notify_plan_activation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.plan in ('premium', 'student') and new.plan is distinct from old.plan then
    insert into public.plan_notifications(user_id, plan) values (new.id, new.plan);
  end if;
  return new;
end;
$$;
revoke all on function private.notify_plan_activation() from public, anon, authenticated;
drop trigger if exists notify_plan_activation on public.profiles;
create trigger notify_plan_activation after update of plan on public.profiles
for each row execute function private.notify_plan_activation();

-- Older databases may not have run the email section of app.sql yet.
create table if not exists public.email_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('digest', 'reminder', 'plan_activation')),
  ref text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind, ref)
);
alter table public.email_log enable row level security;
revoke all on public.email_log from public, anon, authenticated;

-- Keep activation email receipts permanently so repeat jobs cannot resend them.
alter table public.email_log drop constraint if exists email_log_kind_check;
alter table public.email_log add constraint email_log_kind_check
  check (kind in ('digest', 'reminder', 'plan_activation'));
grant select on public.plan_notifications to service_role;
grant select, insert, update, delete on public.email_log to service_role;

commit;
