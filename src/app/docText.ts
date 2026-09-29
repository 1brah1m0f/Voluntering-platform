// Reading an uploaded letter / CV for the AI review. PDFs go to the AI as-is
// (it reads layout and scans); DOCX and TXT are turned into editable text here,
// with no extra library: a .docx is a zip, and browsers can inflate it natively.

/** Largest file we accept (the PDF is sent base64-encoded to the edge function). */
export const MAX_DOC_BYTES = 3 * 1024 * 1024;

export type DocKind = 'pdf' | 'docx' | 'txt';

export function docKind(file: File): DocKind | null {
  const name = file.name.toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.docx')) return 'docx';
  if (file.type === 'text/plain' || name.endsWith('.txt')) return 'txt';
  return null;
}

export async function fileToBase64(file: Blob): Promise<string> {
  const url = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
  return url.slice(url.indexOf(',') + 1);
}

/** Plain text of a .docx (paragraphs separated by newlines). */
export async function docxText(file: Blob): Promise<string> {
  const xml = await zipEntry(await file.arrayBuffer(), 'word/document.xml');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  return [...doc.getElementsByTagName('w:p')]
    .map((p) => [...p.getElementsByTagName('*')].map((n) => (n.nodeName === 'w:t' ? n.textContent : n.nodeName === 'w:tab' ? '\t' : n.nodeName === 'w:br' ? '\n' : '')).join(''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Extracts one file from a zip archive via its central directory. */
async function zipEntry(buf: ArrayBuffer, wanted: string): Promise<string> {
  const v = new DataView(buf);
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65_557); i--) {
    if (v.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('not a zip file');

  let p = v.getUint32(eocd + 16, true);
  for (let n = v.getUint16(eocd + 10, true); n > 0; n--) {
    if (v.getUint32(p, true) !== 0x02014b50) break;
    const method = v.getUint16(p + 10, true);
    const size = v.getUint32(p + 20, true);
    const nameLen = v.getUint16(p + 28, true);
    const next = p + 46 + nameLen + v.getUint16(p + 30, true) + v.getUint16(p + 32, true);
    const name = new TextDecoder().decode(new Uint8Array(buf, p + 46, nameLen));
    if (name === wanted) {
      const local = v.getUint32(p + 42, true);
      const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
      const data = new Uint8Array(buf, start, size);
      if (method === 0) return new TextDecoder().decode(data);
      if (method !== 8) throw new Error(`unsupported zip method ${method}`);
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return new Response(stream).text();
    }
    p = next;
  }
  throw new Error(`${wanted} not found`);
}
