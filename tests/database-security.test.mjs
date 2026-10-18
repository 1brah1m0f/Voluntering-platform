import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const free = id(1), peer = id(2), admin = id(3), paid = id(4);
const opp = id(10);
const schema = await readFile('supabase/app.sql', 'utf8');

before(async () => {
  // Minimal Supabase platform objects; the actual app schema/policies run unmodified.
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create schema storage;
    create table auth.users(id uuid primary key, email text not null, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text);
    create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name, '/'); $$;
    grant usage on schema auth, storage, public to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant execute on functions to service_role;
  `);
  await db.exec(schema);
  await db.exec(await readFile('supabase/migrations/20261018125836_free_platform.sql', 'utf8'));
  for (const n of [1, 2, 3, 4]) await db.query('insert into auth.users(id, email) values ($1, $2)', [id(n), `user${n}@example.test`]);
  await db.query('update public.profiles set is_admin = true where id = $1', [admin]);
  await db.query("update public.profiles set plan = 'premium' where id = $1", [paid]);
  for (let n = 10; n < 15; n++) await db.query(`insert into public.opportunities(id, title, program, deadline, url, created_at) values ($1, 'Test programme', 'ESC', '2030-01-01', 'https://example.test', now() - interval '5 days')`, [id(n)]);
});
after(async () => { await db.close(); });

async function asUser(userId, query, params = []) {
  await db.exec('begin; set local role authenticated;');
  try {
    await db.query("select set_config('request.jwt.claim.sub', $1, true)", [userId]);
    const result = await db.query(query, params);
    await db.exec('commit');
    return result.rows;
  } catch (err) { await db.exec('rollback'); throw err; }
}
async function reserve(userId, action) {
  await db.exec('begin; set local role service_role;');
  try {
    const result = await db.query('select public.reserve_ai_request($1, $2) as result', [userId, action]);
    await db.exec('commit');
    return result.rows[0].result;
  } catch (err) { await db.exec('rollback'); throw err; }
}

test('users cannot raise their plan/admin privileges or reserve AI directly', async () => {
  await assert.rejects(asUser(free, 'update public.profiles set is_admin = true where id = $1', [free]), /permission denied/);
  await assert.rejects(asUser(free, "update public.profiles set plan = 'premium' where id = $1", [free]), /permission denied/);
  await assert.rejects(asUser(free, "select public.reserve_ai_request($1, 'questions')", [free]), /permission denied/);
  assert.deepEqual(await asUser(free, 'select id from public.profiles where id = $1', [peer]), []);
});

test('all AI actions share a daily allowance of 10 for every plan', async () => {
  for (let n = 0; n < 10; n++) {
    await db.query('delete from public.ai_request_windows where user_id = $1', [free]);
    assert.deepEqual(await reserve(free, n % 2 ? 'draft' : 'questions'), { allowed: true, remaining: 9 - n });
  }
  assert.equal((await reserve(free, 'draft')).error, 'daily_limit');
  assert.equal((await reserve(free, 'questions')).error, 'daily_limit');
  const { rows } = await db.query('select count from public.ai_usage where user_id = $1', [free]);
  assert.equal(rows[0].count, 10);
});

test('burst limits cannot be bypassed with question requests and denied calls do not consume uses', async () => {
  for (let n = 0; n < 6; n++) assert.equal((await reserve(paid, 'questions')).allowed, true);
  assert.equal((await reserve(paid, 'review')).error, 'rate_limited');
  const { rows } = await db.query('select count from public.ai_usage where user_id = $1', [paid]);
  assert.equal(rows[0].count, 6);
  await db.query("update public.ai_request_windows set window_start = now() - interval '2 minutes' where user_id = $1", [paid]);
  assert.equal((await reserve(paid, 'review')).remaining, 3);
});

test('saved limits and immutable identity columns hold at the database boundary', async () => {
  for (let n = 10; n < 13; n++) await asUser(free, 'insert into public.saved_opportunities(opportunity_id) values ($1)', [id(n)]);
  await asUser(free, 'insert into public.saved_opportunities(opportunity_id) values ($1)', [id(13)]);
  await assert.rejects(asUser(free, 'update public.saved_opportunities set opportunity_id = $1 where opportunity_id = $2', [id(14), opp]), /permission denied/);
  await db.query('insert into public.opportunities(id, title, program, deadline, url) values ($1, $2, $3, $4, $5)', [id(20), 'New programme', 'ESC', '2030-01-01', 'https://example.test']);
  await asUser(peer, 'insert into public.saved_opportunities(opportunity_id) values ($1)', [id(20)]);
  assert.equal((await asUser(peer, 'select id from public.opportunities where id = $1', [id(20)])).length, 1);
});

test('self-reported acceptance never grants contact access; both approvals and opt-ins are required', async () => {
  await asUser(peer, 'insert into public.saved_opportunities(opportunity_id) values ($1)', [opp]);
  for (const user of [free, peer]) {
    await asUser(user, "update public.saved_opportunities set status = 'accepted' where opportunity_id = $1", [opp]);
    await asUser(user, 'update public.saved_opportunities set share_contact = true where opportunity_id = $1', [opp]);
  }
  assert.deepEqual(await asUser(free, 'select * from public.accepted_peers($1)', [opp]), []);
  await assert.rejects(asUser(free, 'select public.set_acceptance_verified($1, $2, true)', [free, opp]), /NOT_ADMIN/);
  await assert.rejects(asUser(free, 'insert into public.acceptance_verifications(user_id, opportunity_id) values ($1, $2)', [free, opp]), /permission denied/);
  await asUser(admin, 'select public.set_acceptance_verified($1, $2, true)', [free, opp]);
  assert.deepEqual(await asUser(free, 'select * from public.accepted_peers($1)', [opp]), []);
  await asUser(admin, 'select public.set_acceptance_verified($1, $2, true)', [peer, opp]);
  assert.equal((await asUser(free, 'select * from public.accepted_peers($1)', [opp]))[0].email, 'user2@example.test');
  await asUser(peer, 'update public.saved_opportunities set share_contact = false where opportunity_id = $1', [opp]);
  assert.deepEqual(await asUser(free, 'select * from public.accepted_peers($1)', [opp]), []);
  await asUser(free, "update public.saved_opportunities set status = 'saved' where opportunity_id = $1", [opp]);
  const { rows } = await db.query('select * from public.acceptance_verifications where user_id = $1', [free]);
  assert.equal(rows.length, 0);
});

test('notes and search quotas also reject bulk insertion beyond the limits', async () => {
  await asUser(peer, "insert into public.saved_searches(name, params) select 'Search', '' from generate_series(1, 10)");
  await assert.rejects(asUser(peer, "insert into public.saved_searches(name, params) values ('Extra', '')"), /SEARCH_LIMIT/);
  await asUser(peer, "insert into public.notes(body) select 'Note' from generate_series(1, 100)");
  await assert.rejects(asUser(peer, "insert into public.notes(body) values ('Extra')"), /NOTES_LIMIT/);
  assert.deepEqual(await asUser(free, 'select * from public.notes'), []);
});

test('rerunning the bootstrap preserves the final security rules', async () => {
  await db.exec(schema);
  await assert.rejects(asUser(free, "select public.reserve_ai_request($1, 'questions')", [free]), /permission denied/);
  assert.equal((await reserve(free, 'draft')).error, 'daily_limit');
  await assert.rejects(asUser(peer, 'update public.notes set user_id = $1', [free]), /permission denied/);
});

test('programme discussions allow peer answers and one reversible star per user', async () => {
  const [question] = await asUser(free, `insert into public.discussion_questions(scope, title, body) values ('program:erasmus-plus', 'Application question', 'How do I apply?') returning id, author_name`);
  assert.ok(question.author_name);
  const [answer] = await asUser(peer, `insert into public.discussion_answers(question_id, body) values ($1, 'Use the official programme page.') returning question_id`, [question.id]);
  assert.equal(answer.question_id, question.id);
  await asUser(peer, 'insert into public.discussion_stars(question_id) values ($1)', [question.id]);
  await assert.rejects(asUser(peer, 'insert into public.discussion_stars(question_id) values ($1)', [question.id]), /duplicate key/);
  await asUser(peer, 'insert into public.discussion_stars(question_id) values ($1) on conflict (question_id, user_id) do nothing', [question.id]);
  assert.equal((await asUser(free, 'select * from public.discussion_stars where question_id = $1', [question.id])).length, 1);
  await asUser(free, 'delete from public.discussion_stars where question_id = $1', [question.id]);
  assert.equal((await asUser(peer, 'select * from public.discussion_stars where question_id = $1', [question.id])).length, 1);
  await asUser(peer, 'delete from public.discussion_stars where question_id = $1', [question.id]);
  assert.equal((await asUser(free, 'select * from public.discussion_stars where question_id = $1', [question.id])).length, 0);
});

test('discussions reject impersonation, blank content and unknown programme scopes', async () => {
  await assert.rejects(asUser(free, `insert into public.discussion_questions(scope, user_id, title, body) values ('program:erasmus-plus', $1, 'Title', 'Body')`, [peer]), /row-level security/);
  await assert.rejects(asUser(free, `insert into public.discussion_questions(scope, title, body) values ('program:unknown', 'Title', 'Body')`), /row-level security/);
  await assert.rejects(asUser(free, `insert into public.discussion_questions(scope, title, body) values ('program:erasmus-plus', '   ', 'Body')`), /check constraint/);
  await assert.rejects(asUser(free, `insert into public.discussion_questions(scope, author_name, title, body) values ('program:erasmus-plus', 'Another user', 'Title', 'Body')`), /permission denied/);
  await db.exec('begin; set local role anon;');
  try {
    const { rows } = await db.query("select title from public.discussion_questions where scope = 'program:erasmus-plus'");
    assert.ok(rows.length);
    await assert.rejects(db.query(`insert into public.discussion_questions(scope, title, body) values ('program:erasmus-plus', 'Title', 'Body')`), /permission denied/);
  } finally { await db.exec('rollback'); }
});

test('opportunity discussions inherit opportunity visibility, including answers and stars', async () => {
  const hidden = id(80);
  await db.query(`insert into public.opportunities(id, title, program, deadline, url, published) values ($1, 'Draft', 'ESC', '2030-01-01', 'https://example.test', false)`, [hidden]);
  const [q] = await asUser(admin, `insert into public.discussion_questions(scope, title, body) values ($1, 'Draft question', 'Draft details') returning id`, [`opportunity:${hidden}`]);
  await asUser(admin, 'insert into public.discussion_answers(question_id, body) values ($1, $2)', [q.id, 'Draft answer']);
  await asUser(admin, 'insert into public.discussion_stars(question_id) values ($1)', [q.id]);
  for (const table of ['discussion_questions', 'discussion_answers', 'discussion_stars']) {
    const column = table === 'discussion_questions' ? 'id' : 'question_id';
    assert.deepEqual(await asUser(free, `select * from public.${table} where ${column} = $1`, [q.id]), []);
  }
  await assert.rejects(asUser(free, 'insert into public.discussion_answers(question_id, body) values ($1, $2)', [q.id, 'Hidden answer']), /row-level security/);
  await assert.rejects(asUser(free, 'insert into public.discussion_stars(question_id) values ($1)', [q.id]), /row-level security/);
  await assert.rejects(asUser(free, `insert into public.discussion_questions(scope, title, body) values ($1, 'Hidden', 'Hidden')`, [`opportunity:${hidden}`]), /row-level security/);
});


test('legacy plan changes no longer create paid activation notices', async () => {
  const target = id(70);
  await db.query('insert into auth.users(id, email) values ($1, $2)', [target, 'legacy@example.test']);
  await asUser(admin, "select public.set_user_plan($1, 'premium')", [target]);
  assert.deepEqual(await asUser(target, 'select * from public.plan_notifications'), []);
});

test('activation email receipts are restricted to the worker and deduplicate per activation', async () => {
  await db.exec('begin; set local role service_role;');
  try {
    const ref = 'historical-activation';
    await db.query("insert into public.email_log(user_id, kind, ref) values ($1, 'plan_activation', $2)", [paid, ref]);
    const repeated = await db.query("insert into public.email_log(user_id, kind, ref) values ($1, 'plan_activation', $2) on conflict do nothing returning ref", [paid, ref]);
    assert.equal(repeated.rows.length, 0);
    await db.exec('commit');
  } catch (err) { await db.exec('rollback'); throw err; }
  await assert.rejects(asUser(paid, "insert into public.email_log(user_id, kind, ref) values ($1, 'plan_activation', 'forged')", [paid]), /row-level security|permission denied/);
});

test('hackathon preview is inaccessible to guests and regular paid users', async () => {
  const hid = id(80);
  await asUser(admin, `insert into public.hackathons(id,title,organizer,format,deadline,start_date,end_date,description,url,published)
    values ($1,'Build for good','Openly','online','2030-02-01','2030-02-02','2030-02-03','Build a working prototype','https://example.test/hack',true)`, [hid]);
  assert.equal((await asUser(admin, 'select id from public.hackathons where id=$1', [hid])).length, 1);
  assert.deepEqual(await asUser(paid, 'select * from public.hackathons'), []);
  assert.deepEqual(await asUser(free, 'select * from public.hackathons'), []);
  await assert.rejects(asUser(paid, `insert into public.hackathons(title,organizer,format,deadline,start_date,end_date,description,url)
    values ('Forged','User','online','2030-02-01','2030-02-02','2030-02-03','Description','https://example.test')`), /row-level security/);
  assert.equal((await asUser(free, 'delete from public.hackathons where id=$1 returning id', [hid])).length, 0);
  await db.exec('begin; set local role anon;');
  try {
    await assert.rejects(db.query('select * from public.hackathons'), /permission denied/);
  } finally { await db.exec('rollback'); }
});

test('hackathon preparation is private per admin and respects team and date constraints', async () => {
  const hid = id(80), anotherAdmin = id(81);
  await db.query('insert into auth.users(id,email) values ($1,$2)', [anotherAdmin,'preview-admin@example.test']);
  await db.query('update public.profiles set is_admin=true where id=$1', [anotherAdmin]);
  await asUser(admin, "insert into public.hackathon_entries(user_id,hackathon_id,stage) values ($1,$2,'forming_team')", [admin,hid]);
  assert.equal((await asUser(admin, 'select stage from public.hackathon_entries'))[0].stage, 'forming_team');
  assert.deepEqual(await asUser(anotherAdmin, 'select * from public.hackathon_entries'), []);
  await assert.rejects(asUser(anotherAdmin, "insert into public.hackathon_entries(user_id,hackathon_id) values ($1,$2)", [admin,hid]), /row-level security/);
  await assert.rejects(asUser(paid, "insert into public.hackathon_entries(user_id,hackathon_id) values ($1,$2)", [paid,hid]), /row-level security/);
  await assert.rejects(asUser(admin, 'update public.hackathons set team_min=6,team_max=3 where id=$1', [hid]), /hackathon_team/);
  await assert.rejects(asUser(admin, "update public.hackathons set deadline='2030-03-01' where id=$1", [hid]), /hackathon_dates/);
  await assert.rejects(asUser(admin, "update public.hackathons set url='javascript:alert(1)' where id=$1", [hid]), /check constraint/);
  await asUser(admin, "update public.hackathon_entries set stage='submitted' where hackathon_id=$1", [hid]);
  assert.equal((await asUser(admin, 'select stage from public.hackathon_entries'))[0].stage, 'submitted');
  await asUser(admin, 'delete from public.hackathons where id=$1', [hid]);
  assert.deepEqual(await asUser(admin, 'select * from public.hackathon_entries'), []);
});


test('legacy paid plans, admins and free student accounts all get exactly 10 AI uses', async () => {
  for (const [n, plan, accountType, isAdmin, action] of [
    [90, 'premium', 'regular', false, 'review'],
    [91, 'basic', 'student', false, 'student_ask'],
    [92, 'basic', 'regular', true, 'draft'],
  ]) {
    const user = id(n);
    await db.query('insert into auth.users(id, email) values ($1, $2)', [user, `quota${n}@example.test`]);
    await db.query('update public.profiles set plan = $2, account_type = $3, is_admin = $4 where id = $1', [user, plan, accountType, isAdmin]);
    for (let i = 0; i < 10; i++) {
      await db.query('delete from public.ai_request_windows where user_id = $1', [user]);
      assert.deepEqual(await reserve(user, action), { allowed: true, remaining: 9 - i });
    }
    assert.equal((await reserve(user, action)).error, 'daily_limit');
    if (accountType === 'student') assert.deepEqual(await asUser(user, 'select public.is_student() as allowed'), [{ allowed: true }]);
  }
});
