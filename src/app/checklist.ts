import type { Opportunity } from './types';

/** Application-prep checklist ids; labels live in text.ts (prep.items). */
export type PrepItem = 'cv' | 'letter' | 'passport' | 'sending_org' | 'form';

/** The steps that apply to an opportunity (going through a sending organisation only for exchanges / when one is listed). */
export function prepItems(o: Pick<Opportunity, 'kind' | 'is_online' | 'sending_org'>): PrepItem[] {
  const items: PrepItem[] = ['cv', 'letter'];
  if (!o.is_online) items.push('passport');
  if (o.kind === 'youth_exchange' || o.sending_org) items.push('sending_org');
  items.push('form');
  return items;
}

/** After acceptance: getting ready for the trip (labels in text.ts, trip.items). Stored in the same checklist. */
export type TripItem = 'infopack' | 'visa' | 'insurance' | 'tickets' | 'youthpass';

/** Youthpass certificates exist for Erasmus+ youth projects and the European Solidarity Corps. */
const YOUTHPASS = ['Erasmus+', 'European Solidarity Corps', 'SALTO-Youth'];

export function tripItems(o: Pick<Opportunity, 'is_online' | 'country' | 'program'>): TripItem[] {
  const items: TripItem[] = ['infopack'];
  if (!o.is_online) {
    if (o.country !== 'Azərbaycan') items.push('visa', 'insurance');
    items.push('tickets');
  }
  if (YOUTHPASS.includes(o.program)) items.push('youthpass');
  return items;
}

/** Done / total for the checklist of one tracked opportunity. */
export function prepProgress(o: Pick<Opportunity, 'kind' | 'is_online' | 'sending_org'>, done: string[] = []) {
  const items = prepItems(o);
  return { done: items.filter((i) => done.includes(i)).length, total: items.length };
}
