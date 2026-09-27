import { Bell, Bookmark, CalendarClock, CheckCircle2, MapPin, Send } from 'lucide-react';
import { useLang, type EventStatus } from '../i18n';

const statusStyles: Record<EventStatus, string> = {
  saved: 'bg-slate-100 text-slate-700',
  applied: 'bg-brand-100 text-brand-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
};

export function StatusPill({ status }: { status: EventStatus }) {
  const { t } = useLang();
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[status]}`}>
      {t.status[status]}
    </span>
  );
}

export function DeadlineBadge({ days }: { days: number }) {
  const { t } = useLang();
  const tone =
    days <= 0 ? 'bg-slate-100 text-slate-500' : days <= 3 ? 'bg-coral-100 text-coral-800' : days <= 7 ? 'bg-amber-100 text-amber-800' : 'bg-brand-50 text-brand-700';
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
      <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
      {t.mock.daysLeft(days)}
    </span>
  );
}

/** Compact phone-like dashboard used in the hero. Purely decorative. */
export default function DashboardMockup() {
  const { t } = useLang();
  const events = t.events.slice(0, 3);

  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-200/60 via-white to-coral-200/60 blur-2xl" />
      <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">{t.mock.greeting}</p>
            <p className="text-xs text-slate-500">{t.mock.sub}</p>
          </div>
          <span className="relative rounded-full bg-brand-50 p-2 text-brand-700">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-coral-500" />
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { n: 8, l: t.mock.stats.saved, c: 'text-slate-900' },
            { n: 3, l: t.mock.stats.applied, c: 'text-brand-700' },
            { n: 1, l: t.mock.stats.accepted, c: 'text-emerald-700' },
          ].map((s) => (
            <div key={s.l} className="rounded-xl bg-slate-50 px-2 py-2">
              <p className={`text-lg font-extrabold ${s.c}`}>{s.n}</p>
              <p className="truncate text-[11px] font-medium text-slate-500">{s.l}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">{t.mock.today}</p>
        <ul className="mt-2 space-y-2.5">
          {events.map((e) => (
            <li key={e.title} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-brand-600">{e.org}</p>
                  <p className="truncate text-sm font-bold text-slate-900">{e.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3 w-3" />
                    {e.place}
                  </p>
                </div>
                <span className="rounded-lg bg-slate-50 p-1.5 text-slate-500">
                  {e.status === 'saved' ? <Bookmark className="h-4 w-4 fill-coral-500 text-coral-500" /> : e.status === 'applied' ? <Send className="h-4 w-4 text-brand-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <DeadlineBadge days={e.daysLeft} />
                <StatusPill status={e.status} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="absolute -bottom-5 -left-2 hidden max-w-[16rem] animate-float items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2.5 text-xs font-medium text-white shadow-soft sm:flex md:-left-10">
        <Bell className="h-4 w-4 shrink-0 text-coral-300" />
        {t.mock.reminder}
      </div>
    </div>
  );
}
