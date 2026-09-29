// Vercel serverless function behind /sitemap.xml (see vercel.json): the public
// pages plus every published opportunity, so search engines find /o/:id pages.

const SITE = 'https://www.openlyapply.com';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
// Keep in sync with src/content/guides.ts and src/content/programs.ts.
const GUIDES = ['youth-exchange', 'motivation-letter', 'sending-organisation', 'visa-documents'];
const PROGRAMS = ['erasmus-plus', 'european-solidarity-corps', 'salto-youth', 'un-volunteers'];

export default async function handler(req, res) {
  let rows = [];
  if (SUPABASE_URL && ANON_KEY) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/opportunities?select=id,updated_at&order=deadline.desc&limit=5000`, {
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
      });
      if (r.ok) rows = await r.json();
    } catch (err) {
      console.error('sitemap: opportunities fetch failed', err);
    }
  }
  const url = (loc, lastmod) => `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}</url>`;
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    url(`${SITE}/`),
    url(`${SITE}/app`),
    url(`${SITE}/app/calendar`),
    url(`${SITE}/guides`),
    ...GUIDES.map((g) => url(`${SITE}/guides/${g}`)),
    ...PROGRAMS.map((p) => url(`${SITE}/programs/${p}`)),
    ...rows.map((o) => url(`${SITE}/o/${o.id}`, o.updated_at)),
    '</urlset>',
  ].join('\n');
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
}
