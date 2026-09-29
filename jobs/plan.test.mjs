// Run: npm run test:jobs
import test from 'node:test';
import assert from 'node:assert/strict';
import { bakuDate, daysBetween, logKey, planNotifications } from './plan.mjs';

// Monday 2026-10-05 09:00 Baku = 05:00 UTC
const MONDAY = new Date('2026-10-05T05:00:00Z');
const TUESDAY = new Date('2026-10-06T05:00:00Z');

const opp = (id, over = {}) => ({
  id,
  title: `Opp ${id}`,
  program: 'Erasmus+',
  published: true,
  interests: ['environment'],
  deadline: '2026-10-20',
  created_at: '2026-10-03T10:00:00Z',
  ...over,
});
const profile = (id, over = {}) => ({ id, full_name: id, plan: 'basic', interests: ['environment'], digest_opt_out: false, reminders_opt_out: false, last_digest_at: null, ...over });

function run(over = {}) {
  return planNotifications({
    now: MONDAY,
    profiles: [],
    confirmedEmails: new Map(),
    opportunities: [],
    saved: [],
    sent: new Set(),
    ...over,
  });
}

test('date helpers use Baku time', () => {
  assert.equal(bakuDate(new Date('2026-10-04T21:30:00Z')), '2026-10-05'); // 01:30 Baku
  assert.equal(daysBetween('2026-10-05', '2026-10-12'), 7);
  assert.equal(daysBetween('2026-10-05', '2026-10-04'), -1);
});

test('free user gets a digest on Monday, not on Tuesday', () => {
  const input = { profiles: [profile('u1')], confirmedEmails: new Map([['u1', 'a@x.com']]), opportunities: [opp('o1')] };
  assert.equal(run(input).digests.length, 1);
  assert.equal(run({ ...input, now: TUESDAY }).digests.length, 0);
});

test('premium user gets a digest every day', () => {
  const input = {
    now: TUESDAY,
    profiles: [profile('u1', { plan: 'premium' })],
    confirmedEmails: new Map([['u1', 'a@x.com']]),
    opportunities: [opp('o1', { created_at: '2026-10-05T20:00:00Z' })],
  };
  assert.equal(run(input).digests.length, 1);
});

test('digest only lists new, open, published opportunities matching interests', () => {
  const { digests } = run({
    profiles: [profile('u1', { last_digest_at: '2026-10-01T00:00:00Z' })],
    confirmedEmails: new Map([['u1', 'a@x.com']]),
    opportunities: [
      opp('new'),
      opp('old', { created_at: '2026-09-20T00:00:00Z' }),
      opp('closed', { deadline: '2026-10-01' }),
      opp('draft', { published: false }),
      opp('other-topic', { interests: ['sports'] }),
    ],
  });
  assert.deepEqual(
    digests[0].items.map((o) => o.id),
    ['new'],
  );
});

test('free digest skips opportunities still in the 24h Premium window', () => {
  const input = {
    profiles: [profile('free'), profile('prem', { plan: 'premium' })],
    confirmedEmails: new Map([
      ['free', 'f@x.com'],
      ['prem', 'p@x.com'],
    ]),
    opportunities: [opp('fresh', { created_at: '2026-10-05T01:00:00Z' }), opp('older')],
  };
  const byUser = Object.fromEntries(run(input).digests.map((d) => [d.userId, d.items.map((o) => o.id)]));
  assert.deepEqual(byUser.free, ['older']); // fresh one is still Premium-only
  assert.deepEqual(byUser.prem, ['fresh']); // Premium's first daily digest covers the last day
});

test('user with no interests gets everything new', () => {
  const { digests } = run({
    profiles: [profile('u1', { interests: [] })],
    confirmedEmails: new Map([['u1', 'a@x.com']]),
    opportunities: [opp('a'), opp('b', { interests: ['sports'] })],
  });
  assert.equal(digests[0].items.length, 2);
});

test('no email for opted-out, unconfirmed, already-sent, or nothing new', () => {
  const emails = new Map([
    ['u1', 'a@x.com'],
    ['u3', 'c@x.com'],
    ['u4', 'd@x.com'],
  ]);
  const { digests } = run({
    profiles: [profile('u1', { digest_opt_out: true }), profile('u2'), profile('u3'), profile('u4', { interests: ['health'] })],
    confirmedEmails: emails,
    opportunities: [opp('o1')],
    sent: new Set([logKey('u3', 'digest', '2026-10-05')]),
  });
  assert.equal(digests.length, 0);
});

test('premium reminders fire at 7, 3 and 1 days for saved (not applied) items', () => {
  const opportunities = [opp('d7', { deadline: '2026-10-12' }), opp('d3', { deadline: '2026-10-08' }), opp('d5', { deadline: '2026-10-10' }), opp('applied', { deadline: '2026-10-06' })];
  const saved = ['d7', 'd3', 'd5', 'applied'].map((id) => ({ user_id: 'u1', opportunity_id: id, status: id === 'applied' ? 'applied' : 'saved' }));
  const { reminders } = run({
    profiles: [profile('u1', { plan: 'premium', digest_opt_out: true })],
    confirmedEmails: new Map([['u1', 'a@x.com']]),
    opportunities,
    saved,
  });
  assert.deepEqual(reminders[0].refs, ['d3:3', 'd7:7']);
});

test('free users get no reminders; sent reminders are not repeated', () => {
  const opportunities = [opp('d3', { deadline: '2026-10-08' })];
  const saved = [{ user_id: 'u1', opportunity_id: 'd3', status: 'saved' }];
  const emails = new Map([['u1', 'a@x.com']]);
  assert.equal(run({ profiles: [profile('u1', { digest_opt_out: true })], confirmedEmails: emails, opportunities, saved }).reminders.length, 0);
  assert.equal(
    run({
      profiles: [profile('u1', { plan: 'premium', digest_opt_out: true })],
      confirmedEmails: emails,
      opportunities,
      saved,
      sent: new Set([logKey('u1', 'reminder', 'd3:3')]),
    }).reminders.length,
    0,
  );
});

test('--only restricts to one address', () => {
  const { digests } = run({
    profiles: [profile('u1'), profile('u2')],
    confirmedEmails: new Map([
      ['u1', 'a@x.com'],
      ['u2', 'b@x.com'],
    ]),
    opportunities: [opp('o1')],
    only: 'B@x.com',
  });
  assert.deepEqual(
    digests.map((d) => d.email),
    ['b@x.com'],
  );
});

test('student plan gets the Premium daily digest and reminders', () => {
  const { digests, reminders } = planNotifications({
    now: TUESDAY, // not the free weekly day
    profiles: [profile('stu', { plan: 'student' })],
    confirmedEmails: new Map([['stu', 's@x.com']]),
    opportunities: [opp('a', { deadline: '2026-10-09', created_at: '2026-10-05T12:00:00Z' })], // new since yesterday; closes in 3 days
    saved: [{ user_id: 'stu', opportunity_id: 'a', status: 'saved' }],
    sent: new Set(),
  });
  assert.equal(digests.length, 1);
  assert.equal(digests[0].premium, true);
  assert.equal(reminders.length, 1);
});
