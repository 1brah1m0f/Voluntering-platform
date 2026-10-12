import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../supabase/functions/ai/handler.ts';
import { validate } from '../supabase/functions/ai/validation.ts';
import { readJson, PayloadTooLarge } from '../supabase/functions/ai/http.ts';

const id = '00000000-0000-0000-0000-000000000001';
const request = (body) => new Request('https://example.test/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

function setup({ signedIn = true, visible = true, allowed = true, rpcError = false } = {}) {
  let calls = 0, reservations = 0, publicReads = 0;
  function query(data) {
    return { select() { return this; }, eq() { return this; }, async single() { return { data }; }, async maybeSingle() { return { data }; } };
  }
  const user = { auth: { async getUser() { return { data: { user: signedIn ? { id } : null } }; } }, from() { publicReads++; return query(visible ? { published: true, interests: [] } : null); } };
  const admin = {
    from(table) {
      if (table === 'opportunities') throw new Error('Privileged opportunity reads are forbidden');
      return query(table === 'profiles' ? { plan: 'basic', account_type: 'regular', interests: [] } : { count: 0 });
    },
    async rpc() { reservations++; return { data: { allowed, remaining: 0, error: 'question_limit' }, error: rpcError ? {} : null }; },
  };
  const handler = createHandler({ configured: true, userClient: () => user, adminClient: () => admin, generate: async () => { calls++; return { questions: [] }; } });
  return { handler, stats: () => ({ calls, reservations, publicReads }) };
}

test('anonymous, malformed, unavailable and denied requests never reach the provider', async () => {
  const cases = [
    [{ signedIn: false }, { action: 'questions', opportunityId: id }, 401],
    [{}, null, 400], [{}, [], 400],
    [{ visible: false }, { action: 'questions', opportunityId: id }, 404],
    [{ allowed: false }, { action: 'questions', opportunityId: id }, 429],
    [{ rpcError: true }, { action: 'questions', opportunityId: id }, 500],
  ];
  for (const [options, body, status] of cases) {
    const app = setup(options);
    assert.equal((await app.handler(request(body))).status, status);
    assert.equal(app.stats().calls, 0);
  }
});

test('a question request uses caller RLS and reserves capacity before calling Gemini', async () => {
  const app = setup();
  const response = await app.handler(request({ action: 'questions', opportunityId: id, lang: 'az' }));
  assert.equal(response.status, 200);
  assert.deepEqual(app.stats(), { calls: 1, reservations: 1, publicReads: 1 });
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('question lengths, languages and PDF payloads are validated', () => {
  assert.ok(validate({ action: 'draft', opportunityId: id, answers: [{ question: 'a'.repeat(601), answer: 'valid' }] }));
  assert.ok(validate({ action: 'questions', opportunityId: id, lang: 'anything' }));
  assert.ok(validate({ action: 'review', opportunityId: id, docType: 'cv', file: { mimeType: 'application/pdf', data: 'JVBERi!evil' } }));
  assert.equal(validate({ action: 'questions', opportunityId: id }), null);
});

test('streamed payloads are bounded even without Content-Length', async () => {
  const body = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(4 * 1024 * 1024 + 32769)); controller.close(); } });
  const req = new Request('https://example.test/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, duplex: 'half' });
  await assert.rejects(readJson(req), PayloadTooLarge);
});
