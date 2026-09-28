import type { Lang } from '../i18n';
import type { Costs, Kind, Status } from './types';

type Labels<K extends string> = Record<K, Record<Lang, string>>;

export const INTERESTS = {
  environment: { az: 'Ekologiya', en: 'Environment' },
  education: { az: 'Təhsil', en: 'Education' },
  human_rights: { az: 'İnsan hüquqları', en: 'Human rights' },
  culture_arts: { az: 'Mədəniyyət və incəsənət', en: 'Culture & arts' },
  sports: { az: 'İdman', en: 'Sports' },
  digital: { az: 'Rəqəmsal bacarıqlar', en: 'Digital skills' },
  inclusion: { az: 'Sosial inklüziya', en: 'Social inclusion' },
  health: { az: 'Sağlamlıq', en: 'Health' },
  entrepreneurship: { az: 'Sahibkarlıq', en: 'Entrepreneurship' },
  peace: { az: 'Sülh və dialoq', en: 'Peace & dialogue' },
} satisfies Labels<string>;

export type InterestId = keyof typeof INTERESTS;
export const INTEREST_IDS = Object.keys(INTERESTS) as InterestId[];

export const KINDS: Labels<Kind> = {
  youth_exchange: { az: 'Gənclər mübadiləsi', en: 'Youth exchange' },
  training: { az: 'Təlim kursu', en: 'Training course' },
  volunteering: { az: 'Könüllülük', en: 'Volunteering' },
  seminar: { az: 'Seminar / konfrans', en: 'Seminar / conference' },
  online: { az: 'Onlayn', en: 'Online' },
  other: { az: 'Digər', en: 'Other' },
};

export const COSTS: Labels<Costs> = {
  full: { az: 'Xərclər tam qarşılanır', en: 'Fully funded' },
  partial: { az: 'Qismən qarşılanır', en: 'Partly funded' },
  none: { az: 'Öz hesabına', en: 'Self-funded' },
  unknown: { az: 'Məlum deyil', en: 'Not specified' },
};

export const STATUSES: Labels<Status> = {
  saved: { az: 'Saxlanılıb', en: 'Saved' },
  applied: { az: 'Müraciət edilib', en: 'Applied' },
  accepted: { az: 'Qəbul olunub', en: 'Accepted' },
  rejected: { az: 'İmtina', en: 'Rejected' },
};

export const STATUS_ORDER: Status[] = ['saved', 'applied', 'accepted', 'rejected'];

export const COUNTRIES = [
  'Azərbaycan',
  'Almaniya',
  'Avstriya',
  'Belçika',
  'Bolqarıstan',
  'Çexiya',
  'Estoniya',
  'Fransa',
  'Gürcüstan',
  'Xorvatiya',
  'İspaniya',
  'İtaliya',
  'Latviya',
  'Litva',
  'Macarıstan',
  'Niderland',
  'Polşa',
  'Portuqaliya',
  'Rumıniya',
  'Serbiya',
  'Slovakiya',
  'Sloveniya',
  'Türkiyə',
  'Ukrayna',
  'Yunanıstan',
];
