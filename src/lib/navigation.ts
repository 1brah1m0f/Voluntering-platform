const BASE = 'https://openly.invalid';

/** Accept only local paths for return navigation and OAuth callbacks. */
export function safeReturnPath(value: unknown, fallback = '/app/home'): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return fallback;
  if (/[\\\u0000-\u001f\u007f]|%5c|%0[0-9a-f]|%1[0-9a-f]|%7f/i.test(value)) return fallback;
  try {
    const url = new URL(value, BASE);
    if (url.origin !== BASE) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return fallback; }
}
