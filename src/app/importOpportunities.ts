import type { Costs, Kind, OpportunityInput } from './types';

/**
 * Parses and validates JSON pasted into the admin panel and turns it into
 * OpportunityInput objects that backend.createOpportunity() accepts.
 *
 * Accepted shapes: one object, or an array of objects.
 * Keys may be camelCase or snake_case (startDate / start_date, ...), and the
 * Salto Youth announcement keys (title, country, program, deadline, startDate,
 * endDate, link, costs, description) work as they are.
 */

/** Used when the JSON has no "kind". Salto announcements are training courses. */
export const DEFAULT_KIND: Kind = 'training';

/**
 * Program names are free text in the form. Map common spellings to the exact
 * label used in the programs list (src/content/programs.ts), so filters match.
 * Adjust the right-hand side if the label in the list is different.
 */
const PROGRAM_ALIASES: Record<string, string> = {
     salto: 'SALTO-Youth',
   'salto youth': 'SALTO-Youth',
   'salto-youth': 'SALTO-Youth',
  esc: 'European Solidarity Corps',
  erasmus: 'Erasmus+',
  'erasmus+': 'Erasmus+',
};

const KIND_ALIASES: Record<string, Kind> = {
  youth_exchange: 'youth_exchange',
  'youth exchange': 'youth_exchange',
  'gənclər mübadiləsi': 'youth_exchange',
  training: 'training',
  'training course': 'training',
  'təlim': 'training',
  'təlim kursu': 'training',
  volunteering: 'volunteering',
  'könüllülük': 'volunteering',
  seminar: 'seminar',
  online: 'online',
  'onlayn': 'online',
  other: 'other',
  'study visit': 'other',
  'digər': 'other',
};

const COSTS_ALIASES: Record<string, Costs> = {
  full: 'full',
  'tam qarşılanır': 'full',
  'xərclər tam qarşılanır': 'full',
  partial: 'partial',
  'qismən qarşılanır': 'partial',
  none: 'none',
  'qarşılanmır': 'none',
  unknown: 'unknown',
};

const LIMITS = {
  title: 160,
  program: 60,
  organizer: 120,
  country: 60,
  city: 60,
  description: 5000,
  sending_org: 120,
  sending_org_contact: 200,
} as const;

export interface ImportResult {
  items: OpportunityInput[];
  /** Human-readable problems, each starting with the entry number. */
  errors: string[];
}

type Raw = Record<string, unknown>;

function pick(raw: Raw, ...keys: string[]): unknown {
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) return raw[key];
  }
  return undefined;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
}

function bool(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (['true', 'yes', 'bəli', '1'].includes(v)) return true;
    if (['false', 'no', 'xeyr', '0'].includes(v)) return false;
  }
  return fallback;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function toInterests(value: unknown): string[] {
  const list = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];
  return [...new Set(list.map((v) => str(v)).filter(Boolean))];
}

function convert(raw: Raw, label: string, errors: string[]): OpportunityInput | null {
  const problems: string[] = [];

  const title = str(pick(raw, 'title', 'name'));
  if (title.length < 3) problems.push('başlıq ən azı 3 simvol olmalıdır');
  if (title.length > LIMITS.title) problems.push(`başlıq ${LIMITS.title} simvoldan uzundur`);

  const programRaw = str(pick(raw, 'program', 'programme'));
  const program = PROGRAM_ALIASES[programRaw.toLowerCase()] ?? programRaw;
  if (!program) problems.push('"program" boşdur');
  if (program.length > LIMITS.program) problems.push(`program ${LIMITS.program} simvoldan uzundur`);

  const kindRaw = str(pick(raw, 'kind', 'type'));
  let kind: Kind = DEFAULT_KIND;
  if (kindRaw) {
    const mapped = KIND_ALIASES[kindRaw.toLowerCase()];
    if (mapped) kind = mapped;
    else problems.push(`"kind" tanınmadı: ${kindRaw}`);
  }

  const costsRaw = str(pick(raw, 'costs', 'cost'));
  let costs: Costs = 'unknown';
  if (costsRaw) {
    const mapped = COSTS_ALIASES[costsRaw.toLowerCase()];
    if (mapped) costs = mapped;
    else problems.push(`"costs" tanınmadı: ${costsRaw} (full, partial, none, unknown)`);
  }

  const isOnline = bool(pick(raw, 'isOnline', 'is_online', 'online'), false);
  const country = str(pick(raw, 'country'));
  const city = str(pick(raw, 'city'));
  if (!isOnline && !country) problems.push('onlayn deyilsə "country" məcburidir');
  if (country.length > LIMITS.country) problems.push('country çox uzundur');
  if (city.length > LIMITS.city) problems.push('city çox uzundur');

  const deadline = str(pick(raw, 'deadline'));
  if (!isIsoDate(deadline)) problems.push('"deadline" YYYY-MM-DD formatında olmalıdır');

  const startRaw = str(pick(raw, 'startDate', 'start_date'));
  const endRaw = str(pick(raw, 'endDate', 'end_date'));
  if (startRaw && !isIsoDate(startRaw)) problems.push('"startDate" YYYY-MM-DD formatında olmalıdır');
  if (endRaw && !isIsoDate(endRaw)) problems.push('"endDate" YYYY-MM-DD formatında olmalıdır');
  if (isIsoDate(startRaw) && isIsoDate(endRaw) && endRaw < startRaw) {
    problems.push('bitmə tarixi başlama tarixindən əvvəl ola bilməz');
  }

  const url = str(pick(raw, 'url', 'link'));
  if (!/^https?:\/\//i.test(url)) problems.push('"url" http:// və ya https:// ilə başlamalıdır');

  const organizer = str(pick(raw, 'organizer', 'organiser'));
  if (organizer.length > LIMITS.organizer) problems.push('organizer çox uzundur');

  const description = str(pick(raw, 'description', 'about'));
  if (description.length > LIMITS.description) {
    problems.push(`description ${LIMITS.description} simvoldan uzundur`);
  }

  const sendingOrg = str(pick(raw, 'sendingOrg', 'sending_org'));
  const sendingOrgContact = str(pick(raw, 'sendingOrgContact', 'sending_org_contact'));
  if (sendingOrg.length > LIMITS.sending_org) problems.push('sendingOrg çox uzundur');
  if (sendingOrgContact.length > LIMITS.sending_org_contact) {
    problems.push('sendingOrgContact çox uzundur');
  }

  if (problems.length > 0) {
    for (const problem of problems) errors.push(`${label}: ${problem}`);
    return null;
  }

  const input: OpportunityInput = {
    title,
    program,
    organizer,
    kind,
    country,
    city,
    is_online: isOnline,
    interests: toInterests(pick(raw, 'interests', 'topics')),
    deadline,
    start_date: startRaw || null,
    end_date: endRaw || null,
    costs,
    url,
    description,
    published: bool(pick(raw, 'published'), true),
  };
  // Same as the form: leave the optional sending-org fields out when unused,
  // so saving still works on databases without these columns.
  if (sendingOrg) input.sending_org = sendingOrg;
  if (sendingOrgContact) input.sending_org_contact = sendingOrgContact;
  return input;
}

export function parseOpportunityJson(text: string): ImportResult {
  const trimmed = text.trim();
  if (!trimmed) return { items: [], errors: ['JSON boşdur'] };

  let data: unknown;
  try {
    data = JSON.parse(trimmed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'naməlum xəta';
    return { items: [], errors: [`JSON oxunmadı: ${msg}`] };
  }

  const list = Array.isArray(data) ? data : [data];
  if (list.length === 0) return { items: [], errors: ['Siyahı boşdur'] };

  const items: OpportunityInput[] = [];
  const errors: string[] = [];
  list.forEach((entry, index) => {
    const label = `#${index + 1}`;
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      errors.push(`${label}: obyekt olmalıdır`);
      return;
    }
    const raw = entry as Raw;
    const named = str(pick(raw, 'title', 'name'));
    const item = convert(raw, named ? `${label} (${named})` : label, errors);
    if (item) items.push(item);
  });
  return { items, errors };
}
