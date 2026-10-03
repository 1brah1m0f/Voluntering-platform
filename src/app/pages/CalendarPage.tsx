import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { useAppText } from '../text';
import type { Opportunity } from '../types';
import { Chip, ErrorState, Spinner } from '../ui';

const pad = (n: number) => String(n).padStart(2, '0');
const isoDay = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/**
 * /app/calendar: every opportunity's deadline on a month grid (an agenda list on
 * phones). Saved opportunities are highlighted and can be shown on their own.
 */
export default function CalendarPage() {
  const { tx } = useAppText();
  const { userId } = useAuth();
  const { opportunities, saved, error, reload } = useData();
  const now = new Date();
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [onlyMine, setOnlyMine] = useState(false);

  if (error) return <ErrorState onRetry={reload} />;
  if (!opportunities) return <Spinner label={tx.loading} />;

  const shift = (delta: number) => setMonth(({ y, m }) => ({ y: y + Math.floor((m + delta) / 12), m: (((m + delta) % 12) + 12) % 12 }));
  const today = isoDay(now.getFullYear(), now.getMonth(), now.getDate());
  const prefix = `${month.y}-${pad(month.m + 1)}-`;

  const byDay = new Map<string, Opportunity[]>();
  for (const o of opportunities) {
    if (!o.published || !o.deadline.startsWith(prefix)) continue;
    if (onlyMine && !saved.has(o.id)) continue;
    byDay.set(o.deadline, [...(byDay.get(o.deadline) ?? []), o]);
  }

  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const lead = (new Date(month.y, month.m, 1).getDay() + 6) % 7; // Monday-first
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const agenda = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  // Nothing (more) this month? Offer a jump to the next month that has a deadline.
  const monthEnd = `${prefix}31`;
  const upcomingThisMonth = agenda.some(([day]) => day >= today);
  const nextDeadline = upcomingThisMonth
    ? null
    : (opportunities
        .filter((o) => o.published && o.deadline > monthEnd && o.deadline >= today && (!onlyMine || saved.has(o.id)))
        .map((o) => o.deadline)
        .sort()[0] ?? null);
  const jumpTo = (iso: string) => setMonth({ y: Number(iso.slice(0, 4)), m: Number(iso.slice(5, 7)) - 1 });

  const pill = (o: Opportunity) => {
    const mine = saved.has(o.id);
    return (
      <Link
        key={o.id}
        to={`/o/${o.id}`}
        title={o.title}
        className={`flex items-center gap-1 truncate rounded-lg px-2 py-1 text-xs font-bold transition ${
          mine ? 'bg-coral-50 text-coral-800 hover:bg-coral-100' : 'bg-brand-50 text-brand-900 hover:bg-brand-100'
        }`}
      >
        {mine && <Bookmark className="h-3 w-3 shrink-0 fill-current" aria-hidden="true" />}
        <span className="truncate">{o.title}</span>
      </Link>
    );
  };

  return (
    <div>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-[2.75rem] sm:leading-[1.1]">{tx.calendar.title}</h1>
          <p className="mt-2 text-slate-600 sm:text-lg">{tx.calendar.sub}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-white p-1 ring-1 ring-line">
            <button type="button" onClick={() => shift(-1)} aria-label={tx.calendar.prev} className="rounded-full p-1.5 text-slate-600 hover:bg-slate-100">
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <p className="min-w-[9.5rem] text-center font-display text-lg font-bold text-ink" aria-live="polite">
              {tx.calendar.months[month.m]} {month.y}
            </p>
            <button type="button" onClick={() => shift(1)} aria-label={tx.calendar.next} className="rounded-full p-1.5 text-slate-600 hover:bg-slate-100">
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <button type="button" onClick={() => setMonth({ y: now.getFullYear(), m: now.getMonth() })} className="btn-secondary !px-4 !py-1.5 text-sm">
            {tx.calendar.today}
          </button>
          {userId && (
            <Chip on={onlyMine} onClick={() => setOnlyMine((v) => !v)}>
              {tx.calendar.onlyMine}
            </Chip>
          )}
        </div>
      </div>

      {nextDeadline && (
        <button
          type="button"
          onClick={() => jumpTo(nextDeadline)}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
        >
          {tx.calendar.nextDeadline(Number(nextDeadline.slice(8)), tx.calendar.months[Number(nextDeadline.slice(5, 7)) - 1])}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      )}

      <div className="mt-6 items-start gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_17rem]">
        {/* Month grid (tablets and up) */}
        <div className="hidden overflow-hidden rounded-3xl border border-line bg-white shadow-sm sm:block">
          <div className="grid grid-cols-7 border-b border-line bg-paper/60">
            {tx.calendar.weekdays.map((d) => (
              <p key={d} className="px-2 py-2 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                {d}
              </p>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((d, i) => {
              const key = d ? isoDay(month.y, month.m, d) : `empty-${i}`;
              const items = d ? (byDay.get(key) ?? []) : [];
              return (
                <div key={key} className={`min-h-[7.5rem] border-b border-r border-line/60 p-2 [&:nth-child(7n)]:border-r-0 ${d ? '' : 'bg-paper/50'}`}>
                  {d && (
                    <>
                      <p
                        className={`mb-1.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${key === today ? 'bg-brand-900 text-white' : key < today ? 'font-medium text-slate-400' : 'text-ink'}`}
                      >
                        {d}
                      </p>
                      <div className="space-y-1">
                        {items.slice(0, 3).map(pill)}
                        {items.length > 3 && <p className="px-1.5 text-xs font-semibold text-slate-500">{tx.calendar.more(items.length - 3)}</p>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Agenda: the whole view on phones, a side list next to the grid on large screens. */}
        <div className="sm:hidden lg:block">
          <h2 className="mb-3 hidden text-lg font-bold lg:block">
            {tx.calendar.months[month.m]} {month.y}
          </h2>
          {agenda.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-line py-10 text-center text-slate-500 lg:py-6 lg:text-sm">{tx.calendar.empty}</p>
          ) : (
            <ol className="space-y-3 lg:space-y-2">
              {agenda.map(([day, items]) => (
                <li key={day} className="flex gap-3 rounded-2xl border border-line bg-white p-3">
                  <span
                    className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-center leading-none ${day === today ? 'bg-brand-900 text-white' : 'bg-paper text-ink'}`}
                  >
                    <span className="font-display text-lg font-extrabold">{Number(day.slice(8))}</span>
                    <span className="mt-0.5 text-[10px] font-bold uppercase">{tx.calendar.months[month.m].slice(0, 3)}</span>
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">{items.map(pill)}</div>
                </li>
              ))}
            </ol>
          )}
          {userId && (
            <div className="mt-4 hidden space-y-1.5 px-1 text-xs text-slate-600 lg:block">
              <p className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-coral-100 ring-1 ring-coral-200" aria-hidden="true" />
                {tx.card.saved}
              </p>
            </div>
          )}
        </div>
      </div>
      {agenda.length === 0 && <p className="mt-4 hidden text-center text-sm text-slate-500 sm:block lg:hidden">{tx.calendar.empty}</p>}
    </div>
  );
}
