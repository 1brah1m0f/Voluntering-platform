// Public metadata must never use a service-role client.
export const SITE = 'https://www.openlyapply.com';
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function readPublicOpportunities(params) {
  const origin = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!origin || !key) return [];
  // Reject an accidentally configured privileged legacy key.
  if (key.startsWith('sb_secret_')) throw new Error('A public Supabase key is required');
  if (key.split('.').length === 3) {
    const claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
    if (claims.role !== 'anon') throw new Error('A public Supabase key is required');
  }
  const url = new URL('/rest/v1/opportunities', origin);
  if (url.protocol !== 'https:') throw new Error('Supabase requires HTTPS');
  url.search = new URLSearchParams(params).toString();
  const response = await fetch(url, {
    headers: { apikey: key, ...(key.startsWith('sb_publishable_') ? {} : { Authorization: `Bearer ${key}` }) },
    signal: AbortSignal.timeout(5000),
    redirect: 'error',
  });
  if (!response.ok) throw new Error('Public data request failed');
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error('Unexpected public data response');
  return rows;
}
