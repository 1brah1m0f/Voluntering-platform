type BackendConfig = { mode: 'demo' } | { mode: 'supabase'; url: string; key: string };

/** Shared by the build and browser so incomplete production configuration fails closed. */
export function resolveBackendConfig(input: { url?: string; key?: string; enableDemo?: string; production: boolean }): BackendConfig {
  const url = input.url?.trim();
  const key = input.key?.trim();
  if (key?.startsWith('sb_secret_')) throw new Error('A secret Supabase key cannot be used in the browser.');
  if (key && !key.startsWith('sb_publishable_')) {
    try {
      const parts = key.split('.');
      if (parts.length !== 3) throw new Error();
      const claims = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (claims.role !== 'anon') throw new Error();
    } catch { throw new Error('Use a Supabase publishable key or a legacy anon key in the browser.'); }
  }
  if (input.enableDemo === 'true') return { mode: 'demo' };
  if (!url && !key) {
    if (input.production) throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or explicitly enable VITE_ENABLE_DEMO=true for a demo build.');
    return { mode: 'demo' };
  }
  if (!url || !key) throw new Error('Supabase configuration is incomplete. Both public variables are required.');
  if (new URL(url).protocol !== 'https:') throw new Error('Supabase URL must use HTTPS.');
  return { mode: 'supabase', url, key };
}
