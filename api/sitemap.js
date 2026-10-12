import { SITE, readPublicOpportunities } from '../server/public-data.js';
import { allowRead } from '../server/http.js';

// Keep in sync with src/content/guides.ts and src/content/programs.ts.
const GUIDES = ['youth-exchange', 'motivation-letter', 'sending-organisation', 'visa-documents'];
const PROGRAMS = ['erasmus-plus', 'european-solidarity-corps', 'salto-youth', 'un-volunteers'];

export default async function handler(req, res) {
  if (!allowRead(req, res)) return;
  let rows = [];
  try {
    rows = await readPublicOpportunities({ select: 'id,updated_at', order: 'deadline.desc', limit: '5000' });
  } catch {
    console.error('sitemap: public data is unavailable');
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
  res.status(200).send(req.method === 'HEAD' ? '' : xml);
}
