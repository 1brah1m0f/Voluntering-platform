const MAX_BODY_BYTES = 4 * 1024 * 1024 + 32_768;
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});
export const preflight = () => new Response('ok', { headers: cors });
export class PayloadTooLarge extends Error {}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  const length = Number(req.headers.get('content-length'));
  if (length > MAX_BODY_BYTES) throw new PayloadTooLarge();
  if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('JSON required');
  if (!req.body) throw new Error('Body required');
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); throw new PayloadTooLarge(); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const body: unknown = JSON.parse(new TextDecoder().decode(bytes));
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Object required');
  return body as Record<string, unknown>;
}
