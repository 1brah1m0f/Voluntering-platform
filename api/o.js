// Public SEO endpoint. Data reads use the anon key and remain subject to RLS.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { readPublicOpportunities, UUID } from '../server/public-data.js';
import { render } from '../server/opportunity-page.js';
import { allowRead } from '../server/http.js';

export { render } from '../server/opportunity-page.js';

let shell;
async function loadShell() {
  // Included in the function bundle by vercel.json; never fetch a request-supplied host.
  shell ??= readFile(join(process.cwd(), 'dist', 'index.html'), 'utf8').catch((err) => {
    shell = undefined;
    throw err;
  });
  return shell;
}

export default async function handler(req, res) {
  if (!allowRead(req, res)) return;
  const id = typeof req.query?.id === 'string' ? req.query.id : '';
  let html;
  try {
    html = await loadShell();
  } catch {
    console.error('opportunity page: built HTML is unavailable');
    res.status(503).send('Temporarily unavailable');
    return;
  }
  let opportunity = null;
  if (UUID.test(id)) {
    try {
      const rows = await readPublicOpportunities({
        select: 'title,program,country,city,is_online,deadline,description,costs',
        id: `eq.${id}`,
        limit: '1',
      });
      opportunity = rows[0] ?? null;
    } catch {
      console.error('opportunity page: public data is unavailable');
    }
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600');
  res.status(200).send(req.method === 'HEAD' ? '' : opportunity ? render(html, opportunity, id) : html);
}
