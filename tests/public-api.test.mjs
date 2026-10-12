import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import handler, { render } from '../api/o.js';
import sitemap from '../api/sitemap.js';
import { readPublicOpportunities } from '../server/public-data.js';

function response() {
  return { headers: {}, code: null, body: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.code = code; return this; },
    send(body) { this.body = body; return this; },
  };
}

test('the page ignores forwarded hosts and duplicate id parameters without network requests', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Unexpected network request'); };
  try {
    const res = response();
    await handler({ method: 'GET', query: { id: ['bad', 'bad'] }, headers: { 'x-forwarded-host': 'attacker.invalid' } }, res);
    assert.equal(res.code, 200);
    assert.equal(res.body, await readFile('dist/index.html', 'utf8'));
  } finally { globalThis.fetch = original; }
});

test('HTML data is escaped and replacement patterns remain literal', () => {
  const shell = '<head><title>Openly</title><link rel="canonical" href="https://www.openlyapply.com/" /></head><div id="root"></div>';
  const title = '$& $` $\' <script>alert(1)</script> "';
  const html = render(shell, { title, program: 'ESC', deadline: '2026-12-01', description: '<img src=x onerror=alert(1)>' }, '00000000-0000-0000-0000-000000000000');
  assert.ok(html.includes('$&amp; $` $&#39; &lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img'));
  assert.equal((html.match(/<head>/g) || []).length, 1);
});

test('both public functions reject write methods', async () => {
  for (const endpoint of [handler, sitemap]) {
    const res = response();
    await endpoint({ method: 'POST' }, res);
    assert.equal(res.code, 405);
    assert.equal(res.headers.Allow, 'GET, HEAD');
  }
});

test('public data refuses service-role keys and does not follow redirects', async () => {
  const old = { ...process.env };
  const fetch = globalThis.fetch;
  try {
    process.env.SUPABASE_URL = 'https://project.supabase.co';
    process.env.SUPABASE_ANON_KEY = `x.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.x`;
    await assert.rejects(readPublicOpportunities({}), /public Supabase key/);
    process.env.SUPABASE_ANON_KEY = 'sb_publishable_test';
    globalThis.fetch = async (url, options) => {
      assert.equal(url.host, 'project.supabase.co');
      assert.equal(options.redirect, 'error');
      assert.ok(options.signal instanceof AbortSignal);
      assert.equal(options.headers.Authorization, undefined);
      return Response.json([]);
    };
    assert.deepEqual(await readPublicOpportunities({ select: 'id' }), []);
  } finally { process.env = old; globalThis.fetch = fetch; }
});
