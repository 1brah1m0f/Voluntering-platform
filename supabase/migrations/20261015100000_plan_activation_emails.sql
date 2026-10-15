-- Keep activation email receipts permanently so repeat jobs cannot resend them.
alter table public.email_log drop constraint if exists email_log_kind_check;
alter table public.email_log add constraint email_log_kind_check
  check (kind in ('digest', 'reminder', 'plan_activation'));
grant select on public.plan_notifications to service_role;
grant select, insert, update, delete on public.email_log to service_role;
