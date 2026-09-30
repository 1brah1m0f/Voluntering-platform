import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAppText } from '../text';
import type { Scholarship } from '../types';
import { FilterBar, readFilters, type UpdateParams } from './Filters';
import { deadlineInfo, deadlineSortKey, hasPrefs, matchesQuery, scholarshipFit, type DeadlineInfo, type Fit } from './logic';
import { LEVELS } from './roadmap';
import { CoverChips, DeadlineBadge, FitBadge, SaveToggle } from './ui';
import type { StudentData } from './useStudentData';

type Row = { s: Scholarship; info: DeadlineInfo; fit: Fit };

export function ScholarshipsTab({
  data,
  params,
  update,
  onOpen,
  onNeedPrefs,
}: {
  data: StudentData;
  params: URLSearchParams;
  update: UpdateParams;
  onOpen: (id: string) => void;
  onNeedPrefs: () => void;
}) {
  const { tx } = useAppText();
  const f = readFilters(params);
  const all = data.scholarships ?? [];
  const countries = useMemo(() => [...new Set(all.map((s) => s.country))].sort((a, b) => a.localeCompare(b, 'az')), [all]);

  const rows: Row[] = all.map((s) => ({ s, info: deadlineInfo(s), fit: scholarshipFit(s, data.prefs) }));
  const shown = rows
    .filter(
      ({ s, info, fit }) =>
        matchesQuery(f.q, s.name, s.provider, s.country) &&
        (!f.level || s.levels.includes(f.level)) &&
        (!f.field || s.fields.length === 0 || s.fields.includes(f.field)) &&
        (!f.country || s.country === f.country) &&
        // An announced upcoming date means applications are being taken.
        (!f.openNow || info.kind === 'exact' || (info.kind === 'window' && info.open === true)) &&
        (!f.forMe || fit.ok),
    )
    .sort((a, b) => (f.sort === 'name' ? a.s.name.localeCompare(b.s.name) : deadlineSortKey(a.info) - deadlineSortKey(b.info) || a.s.sort - b.s.sort));

  return (
    <div>
      <FilterBar
        params={params}
        update={update}
        countries={countries}
        showOpenNow
        sorts={[
          { id: 'deadline', label: tx.student.sortDeadline },
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
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {shown.map((r) => (
            <ScholarshipCard key={r.s.id} row={r} saved={data.saved.some((x) => x.scholarship_id === r.s.id)} onSave={() => data.sch.toggle(r.s.id)} onOpen={() => onOpen(r.s.id)} />
          ))}
        </div>
      )}
      <p className="mt-6 text-center text-xs text-slate-500">{tx.student.disclaimer}</p>
    </div>
  );
}

/** The facts that decide whether to read on: who, where, what it pays for, when, and whether it fits. */
function ScholarshipCard({ row: { s, info, fit }, saved, onSave, onOpen }: { row: Row; saved: boolean; onSave: () => void; onOpen: () => void }) {
  const { tx, lang } = useAppText();
  return (
    <article className="flex flex-col gap-3 rounded-[1.375rem] border border-line bg-white p-5 transition hover:border-brand-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-700">{s.country}</p>
          <h3 className="mt-1 text-xl font-bold leading-snug">
            <button type="button" onClick={onOpen} className="text-left hover:text-brand-800">
              {s.name}
            </button>
          </h3>
          <p className="mt-0.5 text-sm text-slate-600">{s.provider}</p>
        </div>
        <SaveToggle on={saved} onClick={onSave} withLabel={false} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {s.levels.map((l) => (
          <span key={l} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-900">
            {LEVELS[l]?.[lang] ?? l}
          </span>
        ))}
        {s.funding && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s.funding === 'full' ? 'bg-emerald-50 text-emerald-800' : 'bg-paper text-slate-700'}`}>
            {s.funding === 'full' ? tx.student.fullFunding : tx.student.partialFunding}
          </span>
        )}
      </div>
      {/* Rows loaded before the covers column existed fall back to the text. */}
      {s.covers.length > 0 ? <CoverChips covers={s.covers} /> : <p className="line-clamp-2 text-sm text-slate-700">{s.coverage}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-dashed border-line pt-3">
        <DeadlineBadge info={info} />
        <FitBadge fit={fit} />
        <button type="button" onClick={onOpen} className="ml-auto inline-flex min-h-[2.75rem] items-center gap-1 text-sm font-bold text-brand-700 hover:text-brand-900">
          {tx.student.details}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
