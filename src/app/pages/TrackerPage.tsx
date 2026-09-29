import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Trash2 } from 'lucide-react';
import { FREE_EVENT_LIMIT } from '../../config';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { STATUSES, STATUS_ORDER } from '../taxonomy';
import { useAppText } from '../text';
import type { Status } from '../types';
import { DeadlineChip, ErrorState, ProgramBadge, Spinner, statusClass } from '../ui';
import { daysUntil, formatDate } from '../util';

export default function TrackerPage() {
  const { tx, lang } = useAppText();
  const { profile } = useAuth();
  const { opportunities, saved, setStatus, unsave, error, reload } = useData();
  const [tab, setTab] = useState<Status | 'all'>('all');

  if (error) return <ErrorState onRetry={reload} />;
  if (!opportunities) return <Spinner label={tx.loading} />;

  const rows = opportunities
    .filter((o) => saved.has(o.id))
    .map((o) => ({ o, item: saved.get(o.id)! }))
    .sort((a, b) => a.o.deadline.localeCompare(b.o.deadline));
  const visible = tab === 'all' ? rows : rows.filter((r) => r.item.status === tab);
  const isFree = profile?.plan !== 'premium';

  const run = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (err) {
      console.error('[tracker] update failed', err);
      alert(tx.saveError);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{tx.tracker.title}</h1>
      <p className="mt-1 text-slate-600">{tx.tracker.sub}</p>

      {isFree && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-semibold text-slate-800">{tx.tracker.usage(rows.length)}</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-coral-700">
              <Crown className="h-4 w-4" aria-hidden="true" />
              {tx.tracker.upgrade}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${rows.length >= FREE_EVENT_LIMIT ? 'from-coral-400 to-coral-600' : 'from-brand-400 to-brand-600'}`}
              style={{ width: `${Math.min(100, (rows.length / FREE_EVENT_LIMIT) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div role="tablist" className="mt-6 flex gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200">
        {(['all', ...STATUS_ORDER] as const).map((s) => {
          const n = s === 'all' ? rows.length : rows.filter((r) => r.item.status === s).length;
          return (
            <button
              key={s}
              role="tab"
              type="button"
              aria-selected={tab === s}
              onClick={() => setTab(s)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                tab === s ? 'bg-brand-700 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {s === 'all' ? tx.tracker.all : STATUSES[s][lang]}
              <span className={`rounded-full px-1.5 text-[11px] font-bold ${tab === s ? 'bg-white/20' : 'bg-slate-100'}`}>{n}</span>
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-slate-300 py-14 text-center">
          <p className="text-slate-500">{tx.tracker.empty}</p>
          <Link to="/app" className="btn-primary mt-5">
            {tx.tracker.emptyCta}
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {visible.map(({ o, item }) => {
            const d = daysUntil(o.deadline);
            return (
              <li key={o.id} className="flex animate-[row-in_0.3s_ease] flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <ProgramBadge program={o.program} />
                  <div className="min-w-0">
                    <Link to={`/o/${o.id}`} className="font-bold text-slate-900 hover:text-brand-700">
                      {o.title}
                    </Link>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {o.program} · {formatDate(o.deadline, lang)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <DeadlineChip deadline={o.deadline} />
                      {d >= 0 && (
                        <span className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                          <span
                            className={`block h-full rounded-full ${d <= 3 ? 'bg-coral-500' : d <= 7 ? 'bg-amber-400' : 'bg-brand-400'}`}
                            style={{ width: `${Math.max(8, 100 - (d / 30) * 100)}%` }}
                          />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <select
                    value={item.status}
                    onChange={(e) => run(() => setStatus(o.id, e.target.value as Status))}
                    aria-label={tx.detail.status}
                    className={`rounded-full border-0 px-3 py-1.5 text-sm font-bold focus:ring-2 focus:ring-brand-300 ${statusClass(item.status)}`}
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {STATUSES[s][lang]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => run(() => unsave(o.id))}
                    aria-label={tx.detail.remove}
                    title={tx.detail.remove}
                    className="rounded-full p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
