import test from 'node:test';
import assert from 'node:assert/strict';
import { hackathonMatches, validHackathon } from '../src/app/hackathons/logic.ts';
import { homeFor } from '../src/app/plans.ts';

const h = { id: 'h1', title: 'Climate sprint', organizer: 'Openly', format: 'online', location: '', deadline: '2030-02-01', start_date: '2030-02-02', end_date: '2030-02-04', team_min: 1, team_max: 5, prize: '', technologies: ['Python'], themes: ['Climate'], level: 'all', description: 'Build a prototype', url: 'https://example.test', published: true, created_at: '' };
const filters = { query: '', format: '', level: '', technology: '', savedOnly: false, includeClosed: false };
const matches = (patch = {}, event = h) => hackathonMatches(event, { ...filters, ...patch }, new Set(), '2030-01-01');

test('hackathon discovery combines search, technology, skill, format and tracking filters', () => {
  assert.equal(matches({ query: ' PYTHON ' }), true);
  assert.equal(matches({ query: 'climate', level: 'beginner' }), true);
  assert.equal(matches({ format: 'onsite' }), false);
  assert.equal(matches({ technology: 'React' }), false);
  assert.equal(matches({ savedOnly: true }), false);
  assert.equal(matches({ level: 'beginner' }, { ...h, level: 'experienced' }), false);
  assert.equal(matches({}, { ...h, deadline: '2029-01-01' }), false);
  assert.equal(matches({ includeClosed: true }, { ...h, deadline: '2029-01-01' }), true);
});

test('hackathon editor validates registration order, team bounds and registration links', () => {
  assert.equal(validHackathon(h), true);
  for (const patch of [{ title: ' ' }, { url: 'javascript:alert(1)' }, { start_date: '2029-01-01' }, { end_date: '2029-01-01' }, { team_min: 0 }, { team_max: 101 }, { team_min: 5, team_max: 3 }, { team_min: 1.5 }, { format: 'onsite' }]) assert.equal(validHackathon({ ...h, ...patch }), false);
});

test('discovery preferences affect only admins; regular and student routing stays intact', () => {
  assert.equal(homeFor({ account_type: 'regular', is_admin: true }), '/app/discover');
  assert.equal(homeFor({ account_type: 'regular', is_admin: true, prefs: { discovery_mode: 'hackathons' } }), '/app/hackathons');
  assert.equal(homeFor({ account_type: 'regular', is_admin: true, prefs: { discovery_mode: 'both' } }), '/app/home');
  assert.equal(homeFor({ account_type: 'regular', is_admin: false, prefs: { discovery_mode: 'hackathons' } }), '/app/home');
  assert.equal(homeFor({ account_type: 'student', is_admin: false, prefs: { discovery_mode: 'hackathons' } }), '/student');
});
