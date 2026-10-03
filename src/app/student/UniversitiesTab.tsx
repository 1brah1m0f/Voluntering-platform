import { useMemo } from 'react';
import { ArrowRight, Check, Columns3, Plus, X } from 'lucide-react';
import { useAppText } from '../text';
import type { University } from '../types';
import { FilterBar, readFilters, type UpdateParams } from './Filters';
import { hasPrefs, matchesQuery, universityFit, yearlyCostRange, type Fit } from './logic';
import { FIELDS } from './roadmap';
import { FitBadge, eur, useCostText } from './ui';
import type { StudentData } from './useStudentData';

export const MAX_COMPARE = 3;

export function UniversitiesTab({
  data,
  params,
  update,
  compare,
  onToggleCompare,
  onOpenCompare,
  onOpen,
  onNeedPrefs,
}: {
  data: StudentData;
  params: URLSearchParams;
  update: UpdateParams;
  compare: string[];
  onToggleCompare: (id: string) => void;
  onOpenCompare: () => void;
  onOpen: (id: string) => void;
  onNeedPrefs: () => void;
}) {
  const { tx } = useAppText();
  const f = readFilters(params);
  const all = data.universities ?? [];
  const countries = useMemo(() => [...new Set(all.map((u) => u.country))].sort((a, b) => a.localeCompare(b, 'az')), [all]);
  const cheapest = (u: University) => yearlyCostRange(u)?.min ?? Number.POSITIVE_INFINITY;

  const shown = all
    .map((u) => ({ u, fit: universityFit(u, data.prefs) }))
    .filter(
      ({ u, fit }) =>
        matchesQuery(f.q, u.name, u.city, u.country) &&
        (!f.level || u.levels.includes(f.level)) &&
        (!f.field || u.fields.includes(f.field)) &&
        (!f.country || u.country === f.country) &&
        (!f.forMe || fit.ok),
    )
    .sort((a, b) => (f.sort === 'name' ? a.u.name.localeCompare(b.u.name) : cheapest(a.u) - cheapest(b.u) || a.u.sort - b.u.sort));
  const chosen = compare.map((id) => all.find((u) => u.id === id)).filter((u): u is University => !!u);

  return (
    <div>
      <FilterBar
        params={params}
        update={update}
        countries={countries}
        showOpenNow={false}
        sorts={[
          { id: 'cost', label: tx.student.sortCost },
          { id: 'name', label: tx.student.sortName },
        ]}
        prefsSet={hasPrefs(data.prefs)}
        onNeedPrefs={onNeedPrefs}
      />
      <p className="mt-4 text-sm font-semibold text-slate-500" role="status">
        {tx.student.results(shown.length)}
      </p>
      {shown.length === 0 ? (
        <p className="mt-3 rounded-3xl border border-dashed border-line py-12 text-center text-slate-500">{tx.student.noResults}</p>
      ) : (
        <div className="mt-3 grid gap-4">
          {shown.map(({ u, fit }) => (
            <UniversityCard
              key={u.id}
              u={u}
              fit={fit}
              listed={data.shortlist.some((x) => x.university_id === u.id)}
              onList={() => data.uni.add(u.id)}
              comparing={compare.includes(u.id)}
              compareFull={compare.length >= MAX_COMPARE}
              onCompare={() => onToggleCompare(u.id)}
              onOpen={() => onOpen(u.id)}
            />
          ))}
        </div>
      )}
      <p className="mt-6 text-center text-xs text-slate-500">{tx.student.disclaimer}</p>

      {/* Compare tray: follows the list while there is a selection. */}
      {chosen.length > 0 && (
        <div className="sticky bottom-20 z-30 mt-6 lg:bottom-6">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-brand-900 p-3 pl-5 text-white shadow-soft">
            <ul className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              {chosen.map((u) => (
                <li key={u.id} className="inline-flex max-w-[14rem] items-center gap-1 rounded-full bg-brand-800 py-1 pl-3 pr-1 text-sm font-semibold">
                  <span className="truncate">{u.name}</span>
                  <button type="button" onClick={() => onToggleCompare(u.id)} aria-label={`${tx.student.remove}: ${u.name}`} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-brand-700">
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onOpenCompare}
              disabled={chosen.length < 2}
              className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-brand-900 transition hover:bg-brand-50 disabled:opacity-60"
            >
              <Columns3 className="h-4 w-4" aria-hidden="true" />
              {tx.student.compareN(chosen.length)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UniversityCard({
  u,
  fit,
  listed,
  onList,
  comparing,
  compareFull,
  onCompare,
  onOpen,
}: {
  u: University;
  fit: Fit;
  listed: boolean;
  onList: () => void;
  comparing: boolean;
  compareFull: boolean;
  onCompare: () => void;
  onOpen: () => void;
}) {
  const { tx, lang } = useAppText();
  const costText = useCostText();
  const fee = u.app_fee_eur === null ? '—' : u.app_fee_eur === 0 ? tx.student.free : `~${eur(u.app_fee_eur)}`;
  return (
    <article
      className={`grid gap-5 rounded-3xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card sm:p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_15rem] lg:gap-8 ${
        comparing ? 'border-brand-400 ring-2 ring-brand-100' : 'border-line hover:border-brand-200'
      }`}
    >
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-700">{[u.city, u.country].filter(Boolean).join(', ')}</p>
        <h3 className="mt-1 text-xl font-bold leading-snug sm:text-2xl">
          <button type="button" onClick={onOpen} className="text-left hover:text-brand-800">
            {u.name}
          </button>
        </h3>
        <p className="mt-1 text-sm text-slate-600">{u.language}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {u.fields.slice(0, 4).map((x) => (
            <span key={x} className="rounded-full bg-paper px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {FIELDS[x]?.[lang] ?? x}
            </span>
          ))}
          {u.fields.length > 4 && <span className="px-1 text-xs font-medium text-slate-500">+{u.fields.length - 4}</span>}
        </div>
      </div>

      <dl className="grid grid-cols-3 content-start gap-2 text-sm lg:grid-cols-1 lg:gap-3 lg:border-l lg:border-line lg:pl-8">
        <div className="rounded-xl bg-paper p-2.5 lg:flex lg:items-baseline lg:justify-between lg:gap-3 lg:bg-transparent lg:p-0">
          <dt className="text-xs font-semibold text-slate-500 lg:text-sm">{tx.student.yearCost}</dt>
          <dd className="font-bold text-ink">{costText(yearlyCostRange(u))}</dd>
        </div>
        <div className="rounded-xl bg-paper p-2.5 lg:flex lg:items-baseline lg:justify-between lg:gap-3 lg:bg-transparent lg:p-0">
          <dt className="text-xs font-semibold text-slate-500 lg:text-sm">{tx.student.appFee}</dt>
          <dd className="font-bold text-ink">{fee}</dd>
        </div>
        <div className="rounded-xl bg-paper p-2.5 lg:flex lg:items-baseline lg:justify-between lg:gap-3 lg:bg-transparent lg:p-0">
          <dt className="text-xs font-semibold text-slate-500 lg:text-sm">IELTS</dt>
          <dd className="font-bold text-ink">{u.min_ielts !== null ? `${u.min_ielts}+` : '—'}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-3 border-t border-dashed border-line pt-4 lg:border-l lg:border-t-0 lg:border-solid lg:pl-8 lg:pt-0">
        <div className="flex flex-wrap gap-2">
          <FitBadge fit={fit} minIelts={u.min_ielts} />
        </div>
        <button
          type="button"
          onClick={onList}
          disabled={listed}
          className={`inline-flex min-h-[2.75rem] items-center justify-center gap-1.5 rounded-full px-4 text-sm font-bold transition ${
            listed ? 'bg-emerald-50 text-emerald-800' : 'bg-brand-50 text-brand-900 hover:bg-brand-100'
          }`}
        >
          {listed ? <Check className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
          {listed ? tx.student.inShortlist : tx.student.addShortlist}
        </button>
        <div className="mt-auto grid grid-cols-2 gap-2 lg:grid-cols-1">
          <button type="button" onClick={onOpen} className="btn-secondary !px-4 !py-2.5 text-sm">
            {tx.student.details}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <label
            className={`inline-flex min-h-[2.75rem] cursor-pointer items-center justify-center gap-2 rounded-full border px-3 text-sm font-semibold ${
              comparing ? 'border-brand-300 bg-brand-50 text-brand-900' : 'border-line text-slate-700'
            } ${!comparing && compareFull ? 'cursor-not-allowed opacity-60' : ''}`}
            title={!comparing && compareFull ? tx.student.compareMax : undefined}
          >
            <input type="checkbox" checked={comparing} disabled={!comparing && compareFull} onChange={onCompare} className="h-4 w-4 accent-brand-700" />
            {tx.student.compare}
          </label>
        </div>
      </div>
    </article>
  );
}
