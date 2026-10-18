import test from 'node:test';
import assert from 'node:assert/strict';
import { answers, findAnswer, normalizeQuestion } from '../src/app/chat/answers.ts';

test('prepared chat understands Azerbaijani characters and everyday inflections', () => {
  assert.equal(normalizeQuestion('MÜRACİƏT, ŞİFRƏ!'), 'muraciet sifre');
  for (const [question, expected] of [
    ['Haradan başlayım?', 'start'],
    ['Motivasiya məktubunu necə yazım?', 'letter'],
    ['CV-də nələr olmalıdır?', 'cv'],
    ['Müraciətimi necə göndərim?', 'apply'],
    ['AI limiti nə qədərdir?', 'costs'],
    ['Yol xərcləri qarşılanır?', 'funding'],
    ['Erasmus+ fürsətləri', 'erasmus'],
    ['ESC nədir?', 'esc'],
    ['Profilimi doldurmaq istəyirəm', 'profile'],
    ['How do I track saved opportunities?', 'tracking'],
    ['How do I write a motivation letter?', 'letter'],
    ['Is this free?', 'costs'],
  ]) assert.equal(findAnswer(question)?.id, expected, question);
});

test('unknown input and substring coincidences do not invent answers', () => {
  for (const question of ['', '   ', '123456', 'javascript', 'escapade', '<script>alert(1)</script>']) {
    assert.equal(findAnswer(question), undefined, question);
  }
});

test('each quick question has a bilingual answer and only local navigation links', () => {
  assert.equal(new Set(answers.map(answer => answer.id)).size, answers.length);
  for (const answer of answers) {
    for (const lang of ['az', 'en']) {
      assert.ok(answer.question[lang].trim());
      assert.ok(answer.answer[lang].trim());
    }
    if (answer.link) assert.match(answer.link.to, /^\/app(?:\/|$)/);
  }
});
