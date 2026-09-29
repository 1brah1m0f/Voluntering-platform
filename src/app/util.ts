import type { Lang } from '../i18n';

/** Whole days from today (local) until an ISO date; negative once it has passed. */
export function daysUntil(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / 86_400_000);
}

// Browsers often lack Azerbaijani month names, so spell them out.
const MONTHS: Record<Lang, string[]> = {
  az: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

export function formatDate(isoDate: string | null, lang: Lang): string {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  return lang === 'az' ? `${d} ${MONTHS.az[m - 1]} ${y}` : `${d} ${MONTHS.en[m - 1]} ${y}`;
}

export function formatRange(start: string | null, end: string | null, lang: Lang): string {
  if (start && end) return `${formatDate(start, lang)} – ${formatDate(end, lang)}`;
  return formatDate(start ?? end, lang);
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Center-crops an image file to a square and scales it to `size` px, as a JPEG blob. */
export async function squareImage(file: File, size = 256): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', 0.85));
}
