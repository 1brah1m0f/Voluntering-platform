// Run: npm run test:student (node strips the TypeScript types).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deadlineInfo, deadlineSortKey, inWindow, localize, matchesQuery, scholarshipFit, universityFit, yearlyCostRange } from './logic.ts';

const d = (iso) => {
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, m - 1, day);
};

test('localize uses English text only in English and keeps Azerbaijani for empty keys', () => {
  const row = { name: 'DAAD təqaüdləri', country: 'Almaniya', en: { name: 'DAAD scholarships', country: '  ' } };
  assert.equal(localize(row, 'az').name, 'DAAD təqaüdləri');
  assert.equal(localize(row, 'en').name, 'DAAD scholarships');
  assert.equal(localize(row, 'en').country, 'Almaniya');
  assert.equal(localize({ name: 'x', en: null }, 'en').name, 'x');
});

test('window months wrap over the new year', () => {
  assert.equal(inWindow(12, 11, 1), true);
  assert.equal(inWindow(1, 11, 1), true);
  assert.equal(inWindow(2, 11, 1), false);
  assert.equal(inWindow(1, 1, 2), true);
  assert.equal(inWindow(3, 1, 2), false);
});

test('an announced date wins until it passes, then the usual month takes over', () => {
  const chevening = { deadline: '2026-10-06', opens_month: 8, closes_month: 10 };
  assert.deepEqual(deadlineInfo(chevening, d('2026-09-30')), { kind: 'exact', date: '2026-10-06', days: 6 });
  const after = deadlineInfo(chevening, d('2026-11-02'));
  assert.equal(after.kind, 'window');
  assert.equal(after.closesMonth, 10);
  assert.equal(after.open, false);
  // End of October 2027.
  assert.equal(after.days, 363);
});

test('usual windows: open now, not yet open, unknown opening', () => {
  const hungary = { deadline: null, opens_month: 11, closes_month: 1 };
  const inDec = deadlineInfo(hungary, d('2026-12-10'));
  assert.equal(inDec.open, true);
  assert.equal(inDec.days, 52); // to 31 Jan 2027
  assert.equal(deadlineInfo(hungary, d('2026-09-30')).open, false);
  assert.equal(deadlineInfo({ deadline: null, opens_month: null, closes_month: 2 }, d('2026-09-30')).open, null);
  assert.deepEqual(deadlineInfo({ deadline: null, closes_month: null }, d('2026-09-30')), { kind: 'unknown' });
});

test('sorting puts exact dates first, then estimates, then unknown', () => {
  const keys = [{ kind: 'unknown' }, { kind: 'window', days: 6 }, { kind: 'exact', days: 6 }].map(deadlineSortKey);
  assert.deepEqual(keys, [Infinity, 6.5, 6]);
});

test('yearly cost is a range, with living costs added', () => {
  assert.deepEqual(yearlyCostRange({ tuition_min_eur: 4000, tuition_max_eur: 12000, living_eur_month: 1000 }), { min: 16000, max: 24000 });
  assert.deepEqual(yearlyCostRange({ tuition_min_eur: null, tuition_max_eur: 15600, living_eur_month: 600 }), { min: 22800, max: 22800 });
  assert.equal(yearlyCostRange({ tuition_min_eur: null, tuition_max_eur: null, living_eur_month: 700 }), null);
});

test('fit reasons', () => {
  const uni = { levels: ['bachelor', 'master'], fields: ['cs'], min_ielts: 6.5, tuition_min_eur: 4000, tuition_max_eur: 12000, living_eur_month: 1000 };
  assert.deepEqual(universityFit(uni, {}), { checked: false, ok: true, misses: [] });
  assert.deepEqual(universityFit(uni, { level: 'phd', field: 'law', budget: 10000, ielts: 6 }).misses, ['level', 'field', 'budget', 'ielts']);
  // The cheapest option fits the budget, so it isn't "over budget".
  assert.equal(universityFit(uni, { budget: 16000 }).ok, true);
  // No fields listed = any field.
  assert.equal(scholarshipFit({ levels: ['master'], fields: [] }, { level: 'master', field: 'law' }).ok, true);
  assert.deepEqual(scholarshipFit({ levels: ['master'], fields: ['cs'] }, { level: 'bachelor', field: 'law' }).misses, ['level', 'field']);
});

test('search ignores case and Azerbaijani/Turkish letters', () => {
  assert.equal(matchesQuery('turkiye', 'Türkiyə'), true);
  assert.equal(matchesQuery('BOYUK', 'Böyük Britaniya'), true);
  assert.equal(matchesQuery('', 'anything'), true);
  assert.equal(matchesQuery('japan', 'Chevening', 'United Kingdom'), false);
});

test('roadmap steps tick themselves from what the student did', async () => {
  const { autoSteps, roadmapDone } = await import('./logic.ts');
  const auto = autoSteps({ prefs: { level: 'master', field: 'cs', ielts: 6.5 }, shortlist: [{ status: 'planning' }, { status: 'applied' }], saved: [] });
  assert.equal(auto.goal.met, true);
  assert.equal(auto.budget.met, false);
  assert.deepEqual(auto.shortlist.progress, [2, 5]);
  assert.equal(auto.submit.met, true);
  assert.equal(auto.decide.met, false);
  // A stale manual tick on an automatic step doesn't count; manual steps do.
  assert.deepEqual(roadmapDone(['budget', 'documents'], auto).sort(), ['documents', 'goal', 'language', 'submit'].sort());
});
