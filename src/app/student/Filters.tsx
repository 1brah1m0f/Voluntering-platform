import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useAppText } from '../text';
import type { StudyLevel } from '../types';
import { Chip, inputClass } from '../ui';
import { FIELDS, LEVELS } from './roadmap';

export type UpdateParams = (patch: Record<string, string | null>, push?: boolean) => void;

/** List filters kept in the URL, so they survive opening a details panel and can be shared. */
export function readFilters(params: URLSearchParams) {
  return {
    q: params.get('q') ?? '',
    level: (params.get('level') ?? '') as StudyLevel | '',
    field: params.get('field') ?? '',
    country: params.get('country') ?? '',
    openNow: params.get('open') === '1',
    forMe: params.get('fit') === '1',
    sort: params.get('sort') ?? '',
  };
}

/**
 * Search, level, field, country, quick toggles and sorting. On phones everything
 * but the search box folds behind a "Filters" button.
 */
export function FilterBar({
  params,
  update,
  countries,
  showOpenNow,
  sorts,
  prefsSet,
  onNeedPrefs,
}: {
  params: URLSearchParams;
  update: UpdateParams;
  countries: string[];
  showOpenNow: boolean;
  /** Sort options; the first is the default. */
  sorts: { id: string; label: string }[];
  prefsSet: boolean;
  onNeedPrefs: () => void;
}) {
  const { tx, lang } = useAppText();
  const f = readFilters(params);
  const [open, setOpen] = useState(false);
  const active = [f.level, f.field, f.country, f.openNow, f.forMe].filter(Boolean).length;
  const anything = active > 0 || f.q;
  const toggle = (key: string, on: boolean) => update({ [key]: on ? null : '1' });

  return (
    <div className="space-y-3 rounded-3xl border border-line bg-white p-4 shadow-sm sm:p-5">
      <div className="flex gap-2">
        <label className="relative block flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input type="search" value={f.q} onChange={(e) => update({ q: e.target.value || null })} placeholder={tx.student.search} aria-label={tx.student.search} className={`${inputClass} pl-10`} />
        </label>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold sm:hidden ${open || active ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-line text-slate-700'}`}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {tx.student.filters}
          {active > 0 && <span className="rounded-full bg-brand-700 px-1.5 text-xs font-bold text-white">{active}</span>}
        </button>
      </div>

      <div className={`${open ? 'flex' : 'hidden'} flex-col gap-3 sm:flex`}>
        <div className="flex flex-wrap items-center gap-2">
          <Chip on={f.level === ''} onClick={() => update({ level: null })}>
            {tx.student.allLevels}
          </Chip>
          {(Object.keys(LEVELS) as StudyLevel[]).map((l) => (
            <Chip key={l} on={f.level === l} onClick={() => update({ level: f.level === l ? null : l })}>
              {LEVELS[l][lang]}
            </Chip>
          ))}
          <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden="true" />
          {showOpenNow && (
            <Chip on={f.openNow} onClick={() => toggle('open', f.openNow)}>
              {tx.student.openNow}
            </Chip>
          )}
          <Chip on={f.forMe} onClick={() => (prefsSet ? toggle('fit', f.forMe) : onNeedPrefs())} title={prefsSet ? undefined : tx.student.forMeHint}>
            {tx.student.forMe}
          </Chip>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <select value={f.field} onChange={(e) => update({ field: e.target.value || null })} className={inputClass} aria-label={tx.student.field}>
            <option value="">{tx.student.allFields}</option>
            {Object.entries(FIELDS).map(([id, name]) => (
              <option key={id} value={id}>
                {name[lang]}
              </option>
            ))}
          </select>
          <select value={f.country} onChange={(e) => update({ country: e.target.value || null })} className={inputClass} aria-label={tx.student.allCountries}>
            <option value="">{tx.student.allCountries}</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <span className="shrink-0">{tx.student.sort}</span>
            <select value={f.sort || sorts[0].id} onChange={(e) => update({ sort: e.target.value === sorts[0].id ? null : e.target.value })} className={inputClass}>
              {sorts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {anything && (
        <button
          type="button"
          onClick={() => update({ q: null, level: null, field: null, country: null, open: null, fit: null })}
          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-rose-600"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          {tx.list.clear}
        </button>
      )}
    </div>
  );
}
