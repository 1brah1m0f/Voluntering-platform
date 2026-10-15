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
