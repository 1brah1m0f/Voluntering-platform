import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveBackendConfig } from '../src/lib/backendConfig.ts';
import { safeReturnPath } from '../src/lib/navigation.ts';

test('production configuration requires credentials or an explicit demo opt-in', () => {
  assert.throws(() => resolveBackendConfig({ production: true }), /Set VITE_SUPABASE/);
  assert.deepEqual(resolveBackendConfig({ production: true, enableDemo: 'true' }), { mode: 'demo' });
  assert.deepEqual(resolveBackendConfig({ production: false }), { mode: 'demo' });
  assert.throws(() => resolveBackendConfig({ production: false, url: 'https://example.test' }), /incomplete/);
});

test('privileged keys cannot enter a browser build, even in explicit demo mode', () => {
  for (const key of ['sb_secret_test', `x.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.x`]) {
    assert.throws(() => resolveBackendConfig({ production: true, url: 'https://example.test', key, enableDemo: 'true' }), /key|browser/);
  }
  assert.deepEqual(resolveBackendConfig({ production: true, url: 'https://example.test', key: 'sb_publishable_test' }), {
    mode: 'supabase', url: 'https://example.test', key: 'sb_publishable_test',
  });
});

test('return navigation accepts local paths and rejects external or ambiguous destinations', () => {
  for (const value of ['https://evil.test', '//evil.test', '/\\evil.test', '/%5cevil.test', '/\nevil.test', '/%0aevil.test', null]) {
    assert.equal(safeReturnPath(value), '/app/home');
  }
  assert.equal(safeReturnPath('/login?as=student&claim=student'), '/login?as=student&claim=student');
  assert.equal(safeReturnPath('/o/abc?tab=letter#answers'), '/o/abc?tab=letter#answers');
});
