import type { ReactNode } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { useAppText } from '../text';
import type { University } from '../types';
import { hasPrefs, universityFit, yearlyCostRange } from './logic';
import { FitBadge, Sheet, eur, useCostText } from './ui';
import type { StudentData } from './useStudentData';

type RowDef = {
  label: string;
  cell: (u: University) => ReactNode;
  /** Lower is better; the lowest value is highlighted when the values differ. */
  score?: (u: University) => number | null;
};

/** Up to three universities side by side: one column each, the same rows for all. */
export function CompareSheet({
  open,
  unis,
  data,
  onRemove,
  onOpen,
  onClose,
}: {
  open: boolean;
  unis: University[];
  data: StudentData;
  onRemove: (id: string) => void;
  onOpen: (id: string) => void;
  onClose: () => void;
}) {
  const { tx } = useAppText();
  const costText = useCostText();
  const text = (x: string) => x || '—';

  const rows: RowDef[] = [
    { label: tx.student.place, cell: (u) => [u.city, u.country].filter(Boolean).join(', ') },
    { label: tx.student.language, cell: (u) => text(u.language) },
    { label: tx.student.yearCost, cell: (u) => costText(yearlyCostRange(u)), score: (u) => yearlyCostRange(u)?.min ?? null },
    { label: `${tx.student.living}${tx.student.perMonth}`, cell: (u) => (u.living_eur_month ? `~${eur(u.living_eur_month)}` : '—'), score: (u) => u.living_eur_month },
    {
      label: tx.student.appFee,
      cell: (u) => (u.app_fee_eur === null ? '—' : u.app_fee_eur === 0 ? tx.student.free : `~${eur(u.app_fee_eur)}`),
      score: (u) => u.app_fee_eur,
    },
    { label: 'IELTS', cell: (u) => (u.min_ielts !== null ? `${u.min_ielts}+` : '—') },
    { label: tx.student.exams, cell: (u) => text(u.exams) },
    { label: tx.student.requirements, cell: (u) => text(u.requirements) },
    { label: tx.student.deadline, cell: (u) => text(u.deadline_note) },
    { label: tx.student.scholarshipsNote, cell: (u) => text(u.scholarships_note) },
    // Only once "My plan" has something to compare against.
    ...(hasPrefs(data.prefs) ? [{ label: tx.student.fitsYou, cell: (u: University) => <FitBadge fit={universityFit(u, data.prefs)} minIelts={u.min_ielts} /> }] : []),
  ];

  const best = (r: RowDef): number | null => {
    if (!r.score) return null;
    const values = unis.map(r.score).filter((v): v is number => v !== null);
    if (values.length < 2 || Math.min(...values) === Math.max(...values)) return null;
    return Math.min(...values);
  };

  return (
    <Sheet open={open} onClose={onClose} title={tx.student.compareTitle} wide>
      {/* Phones scroll sideways; the row labels stay put. */}
      <div className="-mx-5 overflow-x-auto px-5 sm:-mx-7 sm:px-7">
        <table className="w-full min-w-[36rem] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <td className="sticky left-0 z-10 w-24 bg-white sm:w-36" />
              {unis.map((u) => {
                const listed = data.shortlist.some((x) => x.university_id === u.id);
                return (
                  <th key={u.id} scope="col" className="min-w-[11rem] p-3 pt-0 text-left align-bottom">
                    <div className="flex items-start justify-between gap-2">
                      <button type="button" onClick={() => onOpen(u.id)} className="text-left font-display text-lg font-bold leading-snug text-ink hover:text-brand-800">
                        {u.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(u.id)}
                        aria-label={`${tx.student.remove}: ${u.name}`}
                        title={tx.student.remove}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-paper hover:text-rose-600"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => data.uni.add(u.id)}
                      disabled={listed}
                      className={`mt-2 inline-flex min-h-[2.25rem] items-center gap-1 rounded-full px-3 text-xs font-bold ${listed ? 'bg-emerald-50 text-emerald-800' : 'bg-brand-50 text-brand-900 hover:bg-brand-100'}`}
                    >
                      {listed ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
                      {listed ? tx.student.inShortlist : tx.student.addShortlist}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const low = best(r);
              return (
                <tr key={r.label}>
                  <th scope="row" className="sticky left-0 z-10 w-24 border-t border-line bg-white py-3 pr-2 text-left align-top text-[0.6875rem] font-bold uppercase tracking-wide text-slate-500 sm:w-36 sm:p-3 sm:text-xs">
                    {r.label}
                  </th>
                  {unis.map((u) => {
                    const isBest = low !== null && r.score?.(u) === low;
                    return (
                      <td key={u.id} className={`border-t border-line p-3 align-top leading-relaxed text-slate-700 ${isBest ? 'bg-emerald-50/70 font-bold text-emerald-900' : ''}`}>
                        {r.cell(u)}
                        {isBest && <span className="mt-1 block text-xs font-bold text-emerald-800">{tx.student.best}</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-5 text-xs text-slate-500">{tx.student.disclaimer}</p>
    </Sheet>
  );
}
