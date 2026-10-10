import { completeness } from './profileProgress';
import type { LangLevel, Opportunity, Profile, ProfileTheme, SavedItem, UserPrefs } from './types';

// Personalisation helpers: profile colours, age rules, the travel "passport",
// achievements. Labels live in text.ts.

/** Cover gradient and swatch per profile colour (full class names so Tailwind keeps them). */
export const THEMES: Record<ProfileTheme, { cover: string; swatch: string }> = {
  teal: { cover: 'from-brand-500 via-brand-700 to-brand-900', swatch: 'bg-brand-600' },
  coral: { cover: 'from-coral-300 via-coral-500 to-rose-600', swatch: 'bg-coral-500' },
  violet: { cover: 'from-violet-400 via-indigo-600 to-indigo-900', swatch: 'bg-violet-600' },
  ocean: { cover: 'from-sky-300 via-blue-600 to-indigo-800', swatch: 'bg-blue-600' },
  forest: { cover: 'from-emerald-300 via-emerald-600 to-teal-900', swatch: 'bg-emerald-600' },
  sunset: { cover: 'from-amber-300 via-orange-500 to-rose-600', swatch: 'bg-orange-500' },
};
export const THEME_IDS = Object.keys(THEMES) as ProfileTheme[];

export const LANG_LEVELS: LangLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native'];

/** ISO codes for the stamps in the travel passport (names as in taxonomy COUNTRIES). */
const ISO: Record<string, string> = {
  Azərbaycan: 'AZ', ABŞ: 'US', Almaniya: 'DE', Avstriya: 'AT', Belçika: 'BE', Bolqarıstan: 'BG', 'Böyük Britaniya': 'GB',
  Çexiya: 'CZ', Çin: 'CN', Estoniya: 'EE', Fransa: 'FR', Gürcüstan: 'GE', Xorvatiya: 'HR', İspaniya: 'ES', İsveçrə: 'CH',
  İtaliya: 'IT', Latviya: 'LV', Litva: 'LT', Macarıstan: 'HU', Moldova: 'MD', Niderland: 'NL', Polşa: 'PL', Portuqaliya: 'PT',
  Rumıniya: 'RO', Rusiya: 'RU', Serbiya: 'RS', Slovakiya: 'SK', Sloveniya: 'SI', Türkiyə: 'TR', Ukrayna: 'UA', Yunanıstan: 'GR',
};
export const countryCode = (name: string) => ISO[name] ?? name.slice(0, 2).toUpperCase();

/** Countries for the passport: where the user was accepted (in Openly) plus past experience abroad. */
export function visitedCountries(prefs: UserPrefs | undefined, accepted: Pick<Opportunity, 'country' | 'is_online'>[]): string[] {
  const all = [...accepted.filter((o) => !o.is_online).map((o) => o.country), ...(prefs?.experiences ?? []).map((e) => e.country ?? '')];
  return [...new Set(all.map((c) => c.trim()).filter((c) => c && c !== 'Azərbaycan'))];
}

/**
 * Typical age limits: youth exchanges 13–30, European Solidarity Corps 18–30,
 * training courses and seminars 18+. Calls can differ; this is only a hint.
 */
export function ageRange(o: Pick<Opportunity, 'kind' | 'program'>): [number, number | null] | null {
  if (o.program === 'European Solidarity Corps') return [18, 30];
  if (o.kind === 'youth_exchange') return [13, 30];
  if (o.kind === 'training' || o.kind === 'seminar') return [18, null];
  return null;
}

/** Whether the user's age fits the usual limits ('young' / 'old' when it doesn't, null when unknown). */
export function ageFit(o: Pick<Opportunity, 'kind' | 'program' | 'deadline' | 'start_date'>, birthYear?: number): 'ok' | 'young' | 'old' | null {
  const range = ageRange(o);
  if (!birthYear || !range) return null;
  // Age in the year the activity starts; the year difference can be one more than
  // the real age, so the upper limit gets a year of slack.
  const age = Number((o.start_date ?? o.deadline).slice(0, 4)) - birthYear;
  if (age < range[0]) return 'young';
  if (range[1] !== null && age > range[1] + 1) return 'old';
  return 'ok';
}

/** Days from start to end, when both dates are known. */
export function durationDays(o: Pick<Opportunity, 'start_date' | 'end_date'>): number | null {
  if (!o.start_date || !o.end_date) return null;
  return Math.round((new Date(o.end_date).getTime() - new Date(o.start_date).getTime()) / 86_400_000) + 1;
}

export type BadgeId = 'first_save' | 'first_apply' | 'five_apply' | 'accepted' | 'profile' | 'polyglot' | 'traveller' | 'resilient';

/** Achievements, earned from what the user has done; the order is the display order. */
export function badges(profile: Profile, items: SavedItem[], countries: string[]): { id: BadgeId; emoji: string; earned: boolean }[] {
  const sent = items.filter((i) => i.status !== 'saved').length;
  return [
    { id: 'first_save', emoji: '🔖', earned: items.length > 0 },
    { id: 'first_apply', emoji: '🚀', earned: sent > 0 },
    { id: 'five_apply', emoji: '🔥', earned: sent >= 5 },
    { id: 'accepted', emoji: '🎉', earned: items.some((i) => i.status === 'accepted') },
    { id: 'profile', emoji: '🌟', earned: completeness(profile).percent >= 100 },
    { id: 'polyglot', emoji: '🗣️', earned: (profile.prefs?.languages?.length ?? 0) >= 3 },
    { id: 'traveller', emoji: '🧭', earned: countries.length >= 3 },
    { id: 'resilient', emoji: '💪', earned: items.some((i) => i.status === 'rejected') && sent >= 2 },
  ];
}
