import type { ReactNode } from 'react';
import { ArrowRight, Info, Trash2 } from 'lucide-react';
import { useAppText } from '../text';
import type { StudyLevel } from '../types';
import { inputClass } from '../ui';
import { deadlineInfo, deadlineSortKey, hasPrefs, scholarshipFit, universityFit, yearlyCostRange, type DeadlineInfo } from './logic';
import { FIELDS, LEVELS, type StudentTab } from './roadmap';
import { DeadlineBadge, StatusSelect, eur } from './ui';
import type { StudentData } from './useStudentData';

const IELTS_STEPS = [0, 5, 5.5, 6, 6.5, 7, 7.5, 8];

type Upcoming = { kind: 'sch' | 'uni'; id: string; name: string; info: DeadlineInfo };

/**
 * "My plan": the student's level, field, IELTS and budget (which drive every
 * "Fits me" mark), what fits, the deadlines of everything saved, and the list itself.
 */
export function PlanTab({
  data,
  goTab,
  openScholarship,
  openUniversity,
}: {
  data: StudentData;
  goTab: (tab: StudentTab, extra?: Record<string, string>) => void;
  openScholarship: (id: string) => void;
  openUniversity: (id: string) => void;
}) {
  const { tx, lang } = useAppText();
  const { prefs, setPrefs } = data;
  const scholarships = data.scholarships ?? [];
  const universities = data.universities ?? [];

  const savedSch = data.saved.flatMap((x) => {
    const s = scholarships.find((it) => it.id === x.scholarship_id);
    return s ? [{ x, s }] : [];
  });
  const listedUni = data.shortlist.flatMap((x) => {
    const u = universities.find((it) => it.id === x.university_id);
    return u ? [{ x, u }] : [];
  });

  const upcoming: Upcoming[] = [
    ...savedSch.map(({ s }) => ({ kind: 'sch' as const, id: s.id, name: s.name, info: deadlineInfo(s) })),
    ...listedUni.map(({ u }) => ({ kind: 'uni' as const, id: u.id, name: u.name, info: deadlineInfo({ closes_month: u.closes_month }) })),
  ].sort((a, b) => deadlineSortKey(a.info) - deadlineSortKey(b.info));

  const fees = listedUni.reduce((sum, { u }) => sum + (u.app_fee_eur ?? 0), 0);
  const costs = listedUni.map(({ u }) => yearlyCostRange(u)).filter((c): c is { min: number; max: number } => c !== null);
  const firstYear = costs.length ? { min: Math.min(...costs.map((c) => c.min)), max: Math.max(...costs.map((c) => c.max)) } : null;
  const prefsSet = hasPrefs(prefs);
  const fitUnis = universities.filter((u) => universityFit(u, prefs).ok).length;
  const fitSch = scholarships.filter((s) => scholarshipFit(s, prefs).ok).length;

  const open = (item: Upcoming) => (item.kind === 'sch' ? openScholarship(item.id) : openUniversity(item.id));
  const monthShort = (m: number) => tx.calendar.months[m - 1].slice(0, 3);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
      <section className="rounded-3xl border border-line bg-white p-5 lg:sticky lg:top-6">
        <h2 className="text-xl font-bold">{tx.student.myInfo}</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{tx.student.myInfoSub}</p>
        <div className="mt-4 space-y-4">
          <label className="block text-sm font-semibold text-slate-800">
            {tx.student.level}
            <select value={prefs.level ?? ''} onChange={(e) => setPrefs({ level: (e.target.value || undefined) as StudyLevel | undefined })} className={`${inputClass} mt-1.5`}>
              <option value="">{tx.student.notSet}</option>
              {(Object.keys(LEVELS) as StudyLevel[]).map((l) => (
                <option key={l} value={l}>
                  {LEVELS[l][lang]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-800">
            {tx.student.field}
            <select value={prefs.field ?? ''} onChange={(e) => setPrefs({ field: e.target.value || undefined })} className={`${inputClass} mt-1.5`}>
              <option value="">{tx.student.anyField}</option>
              {Object.entries(FIELDS).map(([id, name]) => (
                <option key={id} value={id}>
                  {name[lang]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-800">
            {tx.student.ielts}
            <select value={prefs.ielts ?? 0} onChange={(e) => setPrefs({ ielts: Number(e.target.value) || undefined })} className={`${inputClass} mt-1.5`}>
              {IELTS_STEPS.map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? tx.student.noIelts : n.toFixed(1)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-800">
            <span className="flex items-baseline justify-between gap-2">
              {tx.student.budget}
              <span className={prefs.budget ? 'font-display text-lg font-bold text-brand-800' : 'font-medium text-slate-500'}>{prefs.budget ? eur(prefs.budget) : tx.student.notSet}</span>
            </span>
            {/* Until a budget is picked the slider is grey, so its starting position doesn't look like a choice. */}
            <input
              type="range"
              min={2000}
              max={60000}
              step={1000}
              value={prefs.budget ?? 12000}
              onChange={(e) => setPrefs({ budget: Number(e.target.value) })}
              className={`mt-3 w-full ${prefs.budget ? 'accent-brand-700' : 'accent-slate-400'}`}
            />
          </label>
        </div>
      </section>

      <div className="min-w-0 space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {prefsSet ? (
            <>
              <Tile onClick={() => goTab('universities', { fit: '1' })} value={String(fitUnis)} label={tx.student.fitUnis} />
              <Tile onClick={() => goTab('scholarships', { fit: '1' })} value={String(fitSch)} label={tx.student.fitSch} />
            </>
          ) : (
            <p className="flex items-start gap-2.5 rounded-2xl border border-brand-100 bg-brand-50/70 p-4 text-sm font-medium leading-relaxed text-brand-950 sm:col-span-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
              {tx.student.forMeHint}
            </p>
          )}
          <Tile value={listedUni.length === 0 ? '—' : fees === 0 ? eur(0) : `~${eur(fees)}`} label={tx.student.feesTotal} />
          <Tile value={firstYear ? (firstYear.min === firstYear.max ? `~${eur(firstYear.min)}` : `${eur(firstYear.min)} – ${eur(firstYear.max)}`) : '—'} label={tx.student.firstYear} />
        </div>

        <section className="rounded-3xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-xl font-bold">{tx.student.upcomingTitle}</h2>
          {upcoming.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-paper px-4 py-3 text-sm text-slate-600">{tx.student.upcomingEmpty}</p>
          ) : (
            <ol className="mt-4 divide-y divide-line/70">
              {upcoming.map((item) => (
                <li key={`${item.kind}-${item.id}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 sm:gap-4">
                  <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border-[1.5px] border-dashed border-slate-400 leading-none text-slate-700" aria-hidden="true">
                    {item.info.kind === 'exact' ? (
                      <>
                        <span className="text-[0.6875rem] font-bold uppercase tracking-widest">{monthShort(Number(item.info.date.slice(5, 7)))}</span>
                        <span className="mt-0.5 font-display text-2xl font-extrabold">{Number(item.info.date.slice(8, 10))}</span>
                      </>
                    ) : item.info.kind === 'window' ? (
                      <span className="font-display text-base font-extrabold uppercase">{monthShort(item.info.closesMonth)}</span>
                    ) : (
                      <span className="font-display text-lg font-extrabold">—</span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.kind === 'sch' ? tx.student.tabs.scholarships : tx.student.tabs.universities}</p>
                    <button type="button" onClick={() => open(item)} className="block max-w-full truncate text-left font-bold text-ink hover:text-brand-700">
                      {item.name}
                    </button>
                  </div>
                  <span className="hidden sm:block">
                    <DeadlineBadge info={item.info} />
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="rounded-3xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-xl font-bold">{tx.student.myList}</h2>
          <ListGroup
            title={tx.student.tabs.scholarships}
            empty={tx.student.listEmptySch}
            browse={() => goTab('scholarships')}
            items={savedSch.map(({ x, s }) => ({
              id: s.id,
              name: s.name,
              sub: s.country,
              status: x.status,
              onStatus: (st) => data.sch.status(s.id, st),
              onRemove: () => data.sch.toggle(s.id),
              onOpen: () => openScholarship(s.id),
            }))}
          />
          <ListGroup
            title={tx.student.tabs.universities}
            empty={tx.student.listEmptyUni}
            browse={() => goTab('universities')}
            items={listedUni.map(({ x, u }) => ({
              id: u.id,
              name: u.name,
              sub: [u.city, u.country].filter(Boolean).join(', '),
              status: x.status,
              onStatus: (st) => data.uni.status(u.id, st),
              onRemove: () => data.uni.remove(u.id),
              onOpen: () => openUniversity(u.id),
            }))}
          />
        </section>
      </div>
    </div>
  );
}

function Tile({ value, label, onClick }: { value: string; label: string; onClick?: () => void }) {
  const body: ReactNode = (
    <>
      <span className="block font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">{value}</span>
      <span className="mt-1 flex items-center gap-1 text-sm font-medium leading-snug text-slate-600">
        {label}
        {onClick && <ArrowRight className="h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />}
      </span>
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="rounded-2xl border border-line bg-white p-4 text-left transition hover:border-brand-200 hover:bg-paper">
      {body}
    </button>
  ) : (
    <div className="rounded-2xl border border-line bg-white p-4">{body}</div>
  );
}

type ListItem = {
  id: string;
  name: string;
  sub: string;
  status: Parameters<typeof StatusSelect>[0]['value'];
  onStatus: Parameters<typeof StatusSelect>[0]['onChange'];
  onRemove: () => void;
  onOpen: () => void;
};

function ListGroup({ title, empty, browse, items }: { title: string; empty: string; browse: () => void; items: ListItem[] }) {
  const { tx } = useAppText();
  return (
    <div className="mt-5">
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 flex flex-wrap items-center gap-x-3 rounded-2xl bg-paper px-4 py-3 text-sm text-slate-600">
          {empty}
          <button type="button" onClick={browse} className="inline-flex items-center gap-1 font-bold text-brand-700 hover:text-brand-900">
            {title}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-line/70">
          {items.map((it) => (
            <li key={it.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
              {/* Wraps the status onto its own line on phones rather than cutting the name short. */}
              <div className="min-w-[12rem] flex-1">
                <button type="button" onClick={it.onOpen} className="block max-w-full truncate text-left font-bold text-ink hover:text-brand-700">
                  {it.name}
                </button>
                <p className="truncate text-sm text-slate-500">{it.sub}</p>
              </div>
              <StatusSelect value={it.status} onChange={it.onStatus} label={`${tx.detail.status}: ${it.name}`} />
              <button
                type="button"
                onClick={it.onRemove}
                aria-label={`${tx.student.remove}: ${it.name}`}
                title={tx.student.remove}
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-paper hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
