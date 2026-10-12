import { SITE } from './public-data.js';

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
const COSTS = { full: 'Xərclər tam qarşılanır', partial: 'Xərclər qismən qarşılanır' };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

function azDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
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
    return re.test(doc) ? doc.replace(re, () => tag) : doc.replace('</head>', () => `    ${tag}\n  </head>`);
  };

  let out = html.replace(/<title>[^<]*<\/title>/, () => `<title>${esc(title)}</title>`);
  out = out.replace(/<link rel="canonical" href="[^"]*" ?\/?>/, () => `<link rel="canonical" href="${url}" />`);
  out = setMeta(out, 'name', 'description', description);
  out = setMeta(out, 'property', 'og:type', 'article');
  out = setMeta(out, 'property', 'og:url', url);
  out = setMeta(out, 'property', 'og:title', o.title);
  out = setMeta(out, 'property', 'og:description', description);
  out = setMeta(out, 'name', 'twitter:title', o.title);
  out = setMeta(out, 'name', 'twitter:description', description);
  // Readable content for crawlers without JavaScript; React replaces it on load.
  const fallback = `<main><h1>${esc(o.title)}</h1><p>${esc(summary)}</p><p>${esc(o.description ?? '')}</p></main>`;
  return out.replace('<div id="root"></div>', () => `<div id="root">${fallback}</div>`);
}

