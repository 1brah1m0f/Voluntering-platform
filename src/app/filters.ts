import type { Kind, Opportunity } from './types';
import { daysUntil } from './util';

// List filters as URL parameters. Shared by the opportunities page and by saved
// searches (a saved search is just these parameters).

export const ONLINE = '__online__';

export interface Filters {
  q: string;
  /** "My interests" — on by default for users who picked interests (mine=0 turns it off). */
  forYou: boolean;
  program: string;
  kind: Kind | '';
  country: string;
  soon: boolean;
  funded: boolean;
  showClosed: boolean;
}

export function readFilters(params: URLSearchParams, myInterests: string[]): Filters {
  const flag = (key: string) => params.get(key) === '1';
  return {
    q: params.get('q') ?? '',
    forYou: myInterests.length > 0 && params.get('mine') !== '0',
    program: params.get('program') ?? '',
    kind: (params.get('kind') ?? '') as Kind | '',
    country: params.get('country') ?? '',
    soon: flag('soon'),
    funded: flag('funded'),
    showClosed: flag('closed'),
  };
}

export function applyFilters(list: Opportunity[], f: Filters, myInterests: string[]): Opportunity[] {
  const q = f.q.trim().toLowerCase();
  return list.filter((o) => {
    const d = daysUntil(o.deadline);
    if (!f.showClosed && d < 0) return false;
    if (f.soon && (d < 0 || d > 7)) return false;
    if (f.funded && o.costs !== 'full') return false;
    if (f.program && o.program !== f.program) return false;
    if (f.kind && o.kind !== f.kind) return false;
    if (f.country === ONLINE ? !o.is_online : f.country && o.country !== f.country) return false;
    if (f.forYou && myInterests.length && !o.interests.some((i) => myInterests.includes(i))) return false;
    if (q && !`${o.title} ${o.program} ${o.organizer} ${o.country} ${o.city} ${o.description}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

/** The filter part of the URL (sorting and empty values dropped), for saving a search. */
export function filterQuery(params: URLSearchParams): string {
  const keep = new URLSearchParams();
  for (const key of ['q', 'mine', 'program', 'kind', 'country', 'soon', 'funded', 'closed']) {
    const v = params.get(key)?.trim();
    if (v) keep.set(key, v);
  }
  return keep.toString();
}
