// Vercel serverless function behind /o/:id (see vercel.json).
//
// The site is a single-page app, so without this every shared link would show
// the same generic title in WhatsApp / Telegram / Facebook and to crawlers that
// don't run JavaScript. This serves the normal index.html with the opportunity's
// own title, description and canonical URL filled in; the app then loads as usual.
//
// Reads with the public anon key, so Row Level Security applies: drafts and
// opportunities still in the Premium early-access window get the generic page.

const SITE = 'https://www.openlyapply.com';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
const COSTS = { full: 'Xərclər tam qarşılanır', partial: 'Xərclər qismən qarşılanır' };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

function azDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

async function loadOpportunity(id) {
  if (!UUID.test(id) || !SUPABASE_URL || !ANON_KEY) return null;
  const cols = 'title,program,country,city,is_online,deadline,description,costs';
  const res = await fetch(`${SUPABASE_URL}/rest/v1/opportunities?id=eq.${id}&select=${cols}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] ?? null;
}

/** Swaps the page-level tags in index.html for this opportunity's. */
export function render(html, o, id) {
  const url = `${SITE}/o/${id}`;
  const place = o.is_online ? 'Onlayn' : [o.city, o.country].filter(Boolean).join(', ');
  const title = `${o.title} — ${o.program} | Openly`;
  const summary = [o.program, place, `Son tarix: ${azDate(o.deadline)}`, COSTS[o.costs]].filter(Boolean).join(' · ');
  const description = clip(`${summary}. ${o.description ?? ''}`.trim(), 200);

  const setMeta = (doc, attr, key, value) => {
    const re = new RegExp(`<meta ${attr}="${key}" content="[^"]*" ?/?>`);
    const tag = `<meta ${attr}="${key}" content="${esc(value)}" />`;
    return re.test(doc) ? doc.replace(re, tag) : doc.replace('</head>', `    ${tag}\n  </head>`);
  };

  let out = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  out = out.replace(/<link rel="canonical" href="[^"]*" ?\/?>/, `<link rel="canonical" href="${url}" />`);
  out = setMeta(out, 'name', 'description', description);
  out = setMeta(out, 'property', 'og:type', 'article');
  out = setMeta(out, 'property', 'og:url', url);
  out = setMeta(out, 'property', 'og:title', o.title);
  out = setMeta(out, 'property', 'og:description', description);
  out = setMeta(out, 'name', 'twitter:title', o.title);
  out = setMeta(out, 'name', 'twitter:description', description);
  // Readable content for crawlers without JavaScript; React replaces it on load.
  const fallback = `<main><h1>${esc(o.title)}</h1><p>${esc(summary)}</p><p>${esc(o.description ?? '')}</p></main>`;
  return out.replace('<div id="root"></div>', `<div id="root">${fallback}</div>`);
}

export default async function handler(req, res) {
  const id = String(req.query.id ?? '');
  const origin = `https://${req.headers['x-forwarded-host'] || req.headers.host}`;
  let html;
  try {
    html = await (await fetch(`${origin}/index.html`)).text();
  } catch (err) {
    console.error('index.html fetch failed', err);
    res.status(502).send('Temporarily unavailable');
    return;
  }

  let o = null;
  try {
    o = await loadOpportunity(id);
  } catch (err) {
    console.error('opportunity fetch failed', err); // fall back to the generic page
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600');
  res.status(200).send(o ? render(html, o, id) : html);
}
