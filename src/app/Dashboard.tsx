import { Link } from 'react-router-dom';
import { AlarmClock, ArrowRight, Bookmark, PartyPopper, Send, type LucideIcon } from 'lucide-react';
import { useAuth } from './AuthContext';
import { prepProgress } from './checklist';
import { useData } from './DataContext';
import { useAppText } from './text';
import { DeadlineChip, ProgramBadge } from './ui';
import { daysUntil } from './util';

function Stat({ to, Icon, value, label, tone }: { to: string; Icon: LucideIcon; value: number; label: string; tone: string }) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-2xl font-extrabold leading-none text-slate-900">{value}</span>
        <span className="mt-1 block truncate text-sm font-medium text-slate-600">{label}</span>
      </span>
    </Link>
  );
}

/**
 * Top of the opportunities page for signed-in users: a greeting, where their
 * applications stand, and the saved opportunities whose deadlines are coming up.
 */
export function Dashboard({ openCount, fits }: { openCount: number; fits: number }) {
  const { tx } = useAppText();
  const { profile } = useAuth();
  const { opportunities, saved } = useData();

  const tracked = (opportunities ?? []).filter((o) => saved.has(o.id)).map((o) => ({ o, item: saved.get(o.id)! }));
  const count = (status: string) => tracked.filter((r) => r.item.status === status).length;
  // "Upcoming" = saved but not applied yet, still open.
  const pending = tracked.filter((r) => r.item.status === 'saved' && daysUntil(r.o.deadline) >= 0).sort((a, b) => a.o.deadline.localeCompare(b.o.deadline));
  const closing = pending.filter((r) => daysUntil(r.o.deadline) <= 7).length;
  const firstName = (profile?.full_name ?? '').trim().split(/\s+/)[0] ?? '';

  return (
    <section aria-labelledby="dash-title">
      <h1 id="dash-title" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
        {tx.dash.hello(firstName)}
      </h1>
      <p className="mt-1 text-slate-600">{tx.dash.sub(openCount, fits)}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat to="/app/tracker" Icon={Bookmark} value={count('saved')} label={tx.dash.saved} tone="bg-coral-50 text-coral-600" />
        <Stat to="/app/tracker" Icon={Send} value={count('applied')} label={tx.dash.applied} tone="bg-brand-50 text-brand-700" />
        <Stat to="/app/tracker" Icon={PartyPopper} value={count('accepted')} label={tx.dash.accepted} tone="bg-emerald-50 text-emerald-700" />
        <Stat to="/app/tracker" Icon={AlarmClock} value={closing} label={tx.dash.closing} tone="bg-amber-50 text-amber-700" />
      </div>

      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900">{tx.dash.upcoming}</h2>
            <p className="text-sm text-slate-500">{tx.dash.upcomingSub}</p>
          </div>
          {tracked.length > 0 && (
            <Link to="/app/tracker" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
              {tx.dash.allTracked}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
        {pending.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{tx.dash.upcomingEmpty}</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {pending.slice(0, 4).map(({ o, item }) => {
              const prep = prepProgress(o, item.checklist);
              return (
                <li key={o.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <ProgramBadge program={o.program} />
                  <div className="min-w-0 flex-1">
                    <Link to={`/o/${o.id}`} className="block truncate font-semibold text-slate-900 hover:text-brand-700">
                      {o.title}
                    </Link>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                        <span className="block h-full rounded-full bg-brand-500" style={{ width: `${(prep.done / prep.total) * 100}%` }} />
                      </span>
                      <span className="text-xs font-medium text-slate-500">{tx.dash.prep(prep.done, prep.total)}</span>
                    </div>
                  </div>
                  <DeadlineChip deadline={o.deadline} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
