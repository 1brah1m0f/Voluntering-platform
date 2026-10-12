
-- Community questions on programme hubs and individual opportunities.
-- Names are public snapshots; private profiles/emails are never exposed.
create or replace function public.can_read_discussion(discussion_scope text)
returns boolean language sql stable security invoker set search_path = public as $$
  select discussion_scope in (
    'program:erasmus-plus', 'program:european-solidarity-corps',
    'program:salto-youth', 'program:un-volunteers'
  ) or exists (
    select 1 from public.opportunities o
    where discussion_scope = 'opportunity:' || o.id::text
  );
$$;
revoke all on function public.can_read_discussion(text) from public;
grant execute on function public.can_read_discussion(text) to anon, authenticated, service_role;

create table if not exists public.discussion_questions (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (char_length(scope) between 1 and 100),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  author_name text not null default 'İstifadəçi' check (char_length(author_name) between 1 and 120),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  body text not null check (char_length(btrim(body)) between 1 and 3000),
  created_at timestamptz not null default now()
);
create table if not exists public.discussion_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.discussion_questions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  author_name text not null default 'İstifadəçi' check (char_length(author_name) between 1 and 120),
  body text not null check (char_length(btrim(body)) between 1 and 3000),
  created_at timestamptz not null default now()
);
create table if not exists public.discussion_stars (
  question_id uuid not null references public.discussion_questions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  primary key(question_id, user_id)
);
create index if not exists discussion_questions_scope_idx on public.discussion_questions(scope, created_at desc);
create index if not exists discussion_questions_user_idx on public.discussion_questions(user_id);
create index if not exists discussion_answers_question_idx on public.discussion_answers(question_id, created_at);
create index if not exists discussion_answers_user_idx on public.discussion_answers(user_id);
create index if not exists discussion_stars_user_idx on public.discussion_stars(user_id);

create or replace function public.set_discussion_author()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.author_name = coalesce((select left(nullif(btrim(full_name), ''), 120) from public.profiles where id = auth.uid()), 'İstifadəçi');
  new.created_at = now();
  return new;
end;
$$;
revoke all on function public.set_discussion_author() from public;
drop trigger if exists discussion_question_author on public.discussion_questions;
create trigger discussion_question_author before insert on public.discussion_questions
  for each row execute function public.set_discussion_author();
drop trigger if exists discussion_answer_author on public.discussion_answers;
create trigger discussion_answer_author before insert on public.discussion_answers
  for each row execute function public.set_discussion_author();

alter table public.discussion_questions enable row level security;
alter table public.discussion_answers enable row level security;
alter table public.discussion_stars enable row level security;
revoke all on public.discussion_questions, public.discussion_answers, public.discussion_stars from anon, authenticated;
grant select on public.discussion_questions, public.discussion_answers, public.discussion_stars to anon, authenticated;
grant insert (scope, user_id, title, body) on public.discussion_questions to authenticated;
grant insert (question_id, user_id, body) on public.discussion_answers to authenticated;
grant insert, delete on public.discussion_stars to authenticated;
grant all on public.discussion_questions, public.discussion_answers, public.discussion_stars to service_role;

drop policy if exists "read visible questions" on public.discussion_questions;
create policy "read visible questions" on public.discussion_questions for select to anon, authenticated
  using (public.can_read_discussion(scope));
drop policy if exists "ask as self" on public.discussion_questions;
create policy "ask as self" on public.discussion_questions for insert to authenticated
  with check (user_id = (select auth.uid()) and public.can_read_discussion(scope));

drop policy if exists "read visible answers" on public.discussion_answers;
create policy "read visible answers" on public.discussion_answers for select to anon, authenticated
  using (exists (select 1 from public.discussion_questions q where q.id = question_id));
drop policy if exists "answer as self" on public.discussion_answers;
create policy "answer as self" on public.discussion_answers for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.discussion_questions q where q.id = question_id));

drop policy if exists "read visible stars" on public.discussion_stars;
create policy "read visible stars" on public.discussion_stars for select to anon, authenticated
  using (exists (select 1 from public.discussion_questions q where q.id = question_id));
drop policy if exists "star as self" on public.discussion_stars;
create policy "star as self" on public.discussion_stars for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.discussion_questions q where q.id = question_id));
drop policy if exists "unstar as self" on public.discussion_stars;
create policy "unstar as self" on public.discussion_stars for delete to authenticated
  using (user_id = (select auth.uid()));
