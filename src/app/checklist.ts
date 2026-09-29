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

/** Done / total for the checklist of one tracked opportunity. */
export function prepProgress(o: Pick<Opportunity, 'kind' | 'is_online' | 'sending_org'>, done: string[] = []) {
  const items = prepItems(o);
  return { done: items.filter((i) => done.includes(i)).length, total: items.length };
}
