// Pure helpers for the Student section. Type-only imports, so node can run the
// tests in logic.test.mjs against this file directly.
import type { Lang } from '../../i18n';
import type { Scholarship, StudentPrefs, University } from '../types';

/** The row with its English text applied when the UI is in English; missing or empty keys keep the Azerbaijani text. */
export function localize<T extends { en?: Partial<Record<string, string>> | null }>(row: T, lang: Lang): T {
  if (lang !== 'en' || !row.en) return row;
  const out: Record<string, unknown> = { ...row };
  for (const [key, value] of Object.entries(row.en)) {
    if (typeof value === 'string' && value.trim()) out[key] = value;
  }
  return out as T;
}

/** Fills in the v2 columns for rows loaded before supabase/app.sql was re-run. */
export function withScholarshipDefaults(s: Scholarship): Scholarship {
  return { ...s, en: s.en ?? {}, covers: s.covers ?? [], funding: s.funding ?? null, opens_month: s.opens_month ?? null, closes_month: s.closes_month ?? null };
}
export function withUniversityDefaults(u: University): University {
  return { ...u, en: u.en ?? {}, closes_month: u.closes_month ?? null };
}

const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const daysBetween = (from: Date, to: Date) => Math.round((startOfDay(to) - startOfDay(from)) / DAY);
const parseIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Whether month `m` falls in the window opens..closes (1–12), which may wrap over the new year. */
export function inWindow(m: number, opens: number, closes: number): boolean {
  return opens <= closes ? m >= opens && m <= closes : m >= opens || m <= closes;
}

export type DeadlineInfo =
  /** An announced date that hasn't passed. */
  | { kind: 'exact'; date: string; days: number }
  /** The usual window: `days` counts to the end of the closing month (an estimate). `open` is null when the opening month is unknown. */
  | { kind: 'window'; open: boolean | null; opensMonth: number | null; closesMonth: number; days: number }
  | { kind: 'unknown' };

/** When a scholarship (or university) closes next, from its exact date or its usual months. */
export function deadlineInfo(
  row: { deadline?: string | null; opens_month?: number | null; closes_month: number | null },
  today: Date = new Date(),
): DeadlineInfo {
  if (row.deadline) {
    const days = daysBetween(today, parseIso(row.deadline));
    if (days >= 0) return { kind: 'exact', date: row.deadline, days };
  }
  const closes = row.closes_month;
  if (!closes) return { kind: 'unknown' };
  const month = today.getMonth() + 1;
  // Last day of the closing month, this year or next.
  let end = new Date(today.getFullYear(), closes, 0);
  if (startOfDay(end) < startOfDay(today)) end = new Date(today.getFullYear() + 1, closes, 0);
  const opens = row.opens_month ?? null;
  return { kind: 'window', open: opens ? inWindow(month, opens, closes) : null, opensMonth: opens, closesMonth: closes, days: daysBetween(today, end) };
}

/** Sort key: soonest first; exact dates before estimates on the same day; unknown last. */
export function deadlineSortKey(info: DeadlineInfo): number {
  if (info.kind === 'exact') return info.days;
  if (info.kind === 'window') return info.days + 0.5;
  return Number.POSITIVE_INFINITY;
}

/** Yearly cost estimate (tuition + 12 months of living), as a range; null when tuition isn't known. */
export function yearlyCostRange(u: Pick<University, 'tuition_min_eur' | 'tuition_max_eur' | 'living_eur_month'>): { min: number; max: number } | null {
  const lo = u.tuition_min_eur ?? u.tuition_max_eur;
  const hi = u.tuition_max_eur ?? u.tuition_min_eur;
  if (lo === null || hi === null) return null;
  const living = (u.living_eur_month ?? 0) * 12;
  return { min: lo + living, max: hi + living };
}

export type Miss = 'level' | 'field' | 'budget' | 'ielts';
export interface Fit {
  /** Whether any preference is set, i.e. whether a fit badge makes sense at all. */
  checked: boolean;
  ok: boolean;
  misses: Miss[];
}

export const hasPrefs = (p: StudentPrefs) => !!(p.level || p.field || p.budget || p.ielts);

export function scholarshipFit(s: Pick<Scholarship, 'levels' | 'fields'>, p: StudentPrefs): Fit {
  const misses: Miss[] = [];
  if (p.level && !s.levels.includes(p.level)) misses.push('level');
  // No fields listed = open to any field.
  if (p.field && s.fields.length > 0 && !s.fields.includes(p.field)) misses.push('field');
  return { checked: !!(p.level || p.field), ok: misses.length === 0, misses };
}

export function universityFit(u: Pick<University, 'levels' | 'fields' | 'min_ielts' | 'tuition_min_eur' | 'tuition_max_eur' | 'living_eur_month'>, p: StudentPrefs): Fit {
  const misses: Miss[] = [];
  if (p.level && !u.levels.includes(p.level)) misses.push('level');
  if (p.field && !u.fields.includes(p.field)) misses.push('field');
  const cost = yearlyCostRange(u);
  // Over budget only when even the cheapest option is: the range may include a programme that fits.
  if (p.budget && cost && cost.min > p.budget) misses.push('budget');
  if (p.ielts && u.min_ielts !== null && p.ielts < u.min_ielts) misses.push('ielts');
  return { checked: hasPrefs(p), ok: misses.length === 0, misses };
}

/** Case- and accent-insensitive "contains", for the search boxes (e.g. "turkiye" finds "Türkiye"). */
export function matchesQuery(query: string, ...fields: string[]): boolean {
  const norm = (x: string) =>
    x
      .toLocaleLowerCase('az')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/ı/g, 'i')
      .replace(/ə/g, 'e');
  const q = norm(query.trim());
  return !q || fields.some((f) => norm(f).includes(q));
}
