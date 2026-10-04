import { Link, useNavigate } from 'react-router-dom';
import { AlarmClock, ArrowRight, Bookmark, CalendarDays, Check, Crown, PartyPopper, PenLine, Rocket, Search, Send, Sparkles, X, type LucideIcon } from 'lucide-react';
import { backend } from './backend';
import { useAuth } from './AuthContext';
import { applyFilters, readFilters } from './filters';
import type { SavedSearch } from './types';
import { prepProgress } from './checklist';
import { useData } from './DataContext';
import { AiStatusPill, useAiStatus } from './pages/AiPage';
import { isPaidPlan } from './plans';
import { useAppText } from './text';
import { DeadlineChip, useDismissed } from './ui';
import { daysUntil } from './util';

/** One cell of the stats strip; `hot` tints the cell (e.g. deadlines this week). */
function Stat({ to, Icon, value, label, tone, hot = false }: { to: string; Icon: LucideIcon; value: number; label: string; tone: string; hot?: boolean }) {
  return (
    <Link
      to={to}
      className={`flex flex-col gap-2 rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card sm:flex-row sm:items-center sm:gap-3.5 sm:px-5 sm:py-4 ${hot ? 'border-amber-200 bg-amber-50 hover:bg-amber-100/60' : 'border-line bg-white hover:border-brand-200'}`}
    >
      <span className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:flex ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className={`block font-display text-3xl font-bold leading-none ${hot ? 'text-amber-800' : 'text-ink'}`}>{value}</span>
        <span className="mt-1 block text-sm font-medium leading-snug text-slate-600">{label}</span>
      </span>
    </Link>
  );
}

/** Month + day stamp, dashed like a postmark; the colour follows how close the deadline is. */
function DateStamp({ deadline }: { deadline: string }) {
  const { tx } = useAppText();
  const d = daysUntil(deadline);
  const tone = d <= 3 ? 'border-coral-700 text-coral-700' : d <= 7 ? 'border-amber-600 text-amber-800' : 'border-slate-400 text-slate-600';
  return (
    <span className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border-[1.5px] border-dashed leading-none ${tone}`} aria-hidden="true">
      <span className="text-[0.6875rem] font-bold uppercase tracking-widest">{tx.calendar.months[Number(deadline.slice(5, 7)) - 1].slice(0, 3)}</span>
      <span className="mt-0.5 font-display text-2xl font-extrabold">{Number(deadline.slice(8, 10))}</span>
    </span>
  );
}

/**
 * Top of the signed-in home: a greeting with quick actions, where the user's
 * applications stand, the deadlines coming up, the AI assistant and the
 * getting-started steps.
 */
export function Dashboard({
  openCount,
  fits,
  searches,
  setSearches,
}: {
  openCount: number;
  fits: number;
  searches: SavedSearch[];
  setSearches: (fn: (cur: SavedSearch[]) => SavedSearch[]) => void;
}) {
  const { tx } = useAppText();
  const { profile } = useAuth();
  const { opportunities, saved } = useData();
  const navigate = useNavigate();
  const published = (opportunities ?? []).filter((o) => o.published);
  const interests = profile?.interests ?? [];

  const openSearch = (s: SavedSearch) => {
    const seen = new Date().toISOString();
    setSearches((cur) => cur.map((x) => (x.id === s.id ? { ...x, last_seen_at: seen } : x)));
    backend.markSearchSeen(s.id).catch((err) => console.error('[searches] mark seen failed', err));
    navigate(`/app?${s.params}`);
  };
  const removeSearch = async (s: SavedSearch) => {
    try {
      await backend.deleteSearch(s.id);
      setSearches((cur) => cur.filter((x) => x.id !== s.id));
    } catch (err) {
      console.error('[searches] delete failed', err);
      alert(tx.saveError);
    }
  };

  const tracked = (opportunities ?? []).filter((o) => saved.has(o.id)).map((o) => ({ o, item: saved.get(o.id)! }));
  const count = (status: string) => tracked.filter((r) => r.item.status === status).length;
  // "Upcoming" = saved but not applied yet, still open.
  const pending = tracked.filter((r) => r.item.status === 'saved' && daysUntil(r.o.deadline) >= 0).sort((a, b) => a.o.deadline.localeCompare(b.o.deadline));
  const closing = pending.filter((r) => daysUntil(r.o.deadline) <= 7).length;
  const firstName = (profile?.full_name ?? '').trim().split(/\s+/)[0] ?? '';
  const premium = isPaidPlan(profile?.plan);

  return (
    <section aria-labelledby="dash-title">
      <div className="relative overflow-hidden rounded-[2rem] bg-brand-900 p-6 text-white shadow-soft sm:p-8 lg:flex lg:items-end lg:justify-between lg:gap-8 lg:p-10">
        {/* The sun and ring from the logo. Decorative. */}
        <span className="pointer-events-none absolute -top-32 right-10 hidden h-60 w-60 rounded-full bg-coral-500/90 md:block" aria-hidden="true" />
        <span className="pointer-events-none absolute -bottom-40 -left-24 h-72 w-72 rounded-full border-[22px] border-brand-800" aria-hidden="true" />
        <div className="relative max-w-2xl">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-200">
            {tx.nav.home}
            <span className={`rounded-full px-2 py-0.5 text-[0.6875rem] tracking-normal ${premium ? 'bg-amber-300 text-amber-950' : 'bg-white/15 text-white'}`}>
              {premium ? `✦ ${tx.profile.premium}` : tx.profile.basic}
            </span>
          </p>
          <h1 id="dash-title" className="mt-2 text-3xl font-extrabold tracking-tight !text-white sm:text-[2.75rem] sm:leading-[1.1]">
            {tx.dash.hello(firstName)}
          </h1>
          <p className="mt-2 text-brand-100 sm:text-lg">{tx.dash.sub(openCount, fits)}</p>
        </div>
        <div className="relative mt-6 flex flex-wrap gap-2 lg:mt-0 lg:shrink-0">
          <Link to="/app" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-bold text-brand-900 transition hover:bg-brand-50">
            <Search className="h-4 w-4" aria-hidden="true" />
            {tx.dash.findCta}
          </Link>
          <Link to="/app/calendar" className="inline-flex items-center gap-2 rounded-full border border-brand-600 bg-brand-800 px-5 py-2.5 font-bold text-white transition hover:border-brand-500">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {tx.dash.calendarCta}
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat to="/app/tracker" Icon={Bookmark} value={count('saved')} label={tx.dash.saved} tone="bg-coral-50 text-coral-700" />
        <Stat to="/app/tracker" Icon={Send} value={count('applied')} label={tx.dash.applied} tone="bg-brand-50 text-brand-700" />
        <Stat to="/app/tracker" Icon={PartyPopper} value={count('accepted')} label={tx.dash.accepted} tone="bg-emerald-50 text-emerald-700" />
        <Stat to="/app/tracker" Icon={AlarmClock} value={closing} label={tx.dash.closing} tone="bg-amber-100 text-amber-800" hot={closing > 0} />
      </div>

      {searches.length > 0 && (
        <div className="mt-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{tx.searches.title}</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {searches.map((s) => {
              const matches = applyFilters(published, readFilters(new URLSearchParams(s.params), interests), interests);
              const fresh = matches.filter((o) => new Date(o.created_at) > new Date(s.last_seen_at)).length;
              return (
                <li key={s.id} className="flex items-center rounded-full border border-line bg-white">
                  <button
                    type="button"
                    onClick={() => openSearch(s)}
                    className="flex items-center gap-2 rounded-l-full py-1.5 pl-3 pr-2 text-sm font-semibold text-slate-800 hover:text-brand-700"
                  >
                    <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    {s.name}
                    <span className="text-xs font-medium text-slate-500">{tx.searches.matches(matches.length)}</span>
                    {fresh > 0 && <span className="rounded-full bg-coral-600 px-1.5 text-xs font-bold text-white">{tx.searches.fresh(fresh)}</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSearch(s)}
                    aria-label={tx.searches.remove}
                    title={tx.searches.remove}
                    className="rounded-r-full py-1.5 pl-1 pr-2.5 text-slate-400 hover:text-rose-600"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-3">
        <div className="min-w-0 rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">{tx.dash.upcoming}</h2>
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
            <div className="mt-4 flex flex-col items-start gap-3 rounded-2xl bg-paper px-4 py-4 sm:flex-row sm:items-center">
              <Bookmark className="h-8 w-8 shrink-0 text-coral-600" aria-hidden="true" />
              <p className="flex-1 text-sm text-slate-600">{tx.dash.upcomingEmpty}</p>
              <Link to="/app" className="btn-secondary shrink-0 !py-2 text-sm">
                {tx.dash.findCta}
              </Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line/70">
              {pending.slice(0, 5).map(({ o, item }) => {
                const prep = prepProgress(o, item.checklist);
                return (
                  <li key={o.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 sm:gap-4">
                    <DateStamp deadline={o.deadline} />
                    <div className="min-w-0 flex-1">
                      <Link to={`/o/${o.id}`} className="block truncate font-bold text-ink hover:text-brand-700">
                        {o.title}
                      </Link>
                      <p className="truncate text-sm text-slate-500">{[o.program, o.is_online ? tx.list.online : o.city || o.country].filter(Boolean).join(' · ')}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="h-1.5 w-24 overflow-hidden rounded-full bg-paper" aria-hidden="true">
                          <span className="block h-full rounded-full bg-brand-700" style={{ width: `${(prep.done / prep.total) * 100}%` }} />
                        </span>
                        <span className="text-xs font-medium text-slate-500">{tx.dash.prep(prep.done, prep.total)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <DeadlineChip deadline={o.deadline} />
                      {premium && (
                        <Link to={`/o/${o.id}?tab=letter`} className="hidden items-center gap-1 text-xs font-bold text-violet-700 hover:underline sm:inline-flex">
                          <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
                          {tx.aiHub.write}
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <AiCard nextId={pending[0]?.o.id} nextTitle={pending[0]?.o.title} />
          <GettingStarted searches={searches.length} />
        </div>
      </div>
    </section>
  );
}

/** The AI assistant on the dashboard: whether it's on, and a shortcut to the next letter to write. */
function AiCard({ nextId, nextTitle }: { nextId?: string; nextTitle?: string }) {
  const { tx } = useAppText();
  const status = useAiStatus();
  const locked = status === 'locked';
  return (
    <div className="relative overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-700 text-white shadow">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <AiStatusPill status={status} />
      </div>
      <h2 className="mt-3 text-lg font-extrabold text-violet-950">{tx.ai.title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-violet-900/80">{locked ? tx.aiHub.lockedText : tx.ai.sub}</p>
      {!locked && nextId && nextTitle && (
        <Link to={`/o/${nextId}?tab=letter`} className="mt-3 flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-sm font-semibold text-violet-900 ring-1 ring-violet-100 transition hover:ring-violet-300">
          <PenLine className="h-4 w-4 shrink-0 text-violet-600" aria-hidden="true" />
          <span className="min-w-0 truncate">{tx.aiHub.dashNext(nextTitle)}</span>
        </Link>
      )}
      <Link
        to={locked ? '/app/profile?tab=premium' : '/app/ai'}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-violet-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-800"
      >
        {locked ? <Crown className="h-4 w-4" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
        {locked ? tx.aiHub.lockedCta : tx.aiHub.dashCta}
      </Link>
    </div>
  );
}

/** First steps for a new account; hides itself once everything is done or the user closes it. */
function GettingStarted({ searches }: { searches: number }) {
  const { tx } = useAppText();
  const s = tx.start;
  const { profile } = useAuth();
  const { saved } = useData();
  const [closed, close] = useDismissed('getting-started');
  if (!profile || closed) return null;

  const items = [...saved.values()];
  const steps: { key: keyof typeof s.steps; done: boolean; to: string }[] = [
    { key: 'interests', done: profile.interests.length > 0, to: '/app/profile' },
    { key: 'profile', done: !!profile.avatar_url && !!profile.headline?.trim(), to: '/app/profile' },
    { key: 'about', done: !!profile.about?.trim(), to: '/app/profile' },
    { key: 'save', done: items.length > 0, to: '/app' },
    { key: 'search', done: searches > 0, to: '/app' },
    { key: 'applied', done: items.some((i) => i.status !== 'saved'), to: '/app/tracker' },
  ];
  const done = steps.filter((st) => st.done).length;
  if (done === steps.length) return null;

  return (
    <div className="relative rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6">
      <button
        type="button"
        onClick={close}
        aria-label={s.hide}
        title={s.hide}
        className="absolute right-3 top-3 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
      <div className="flex items-center gap-3 pr-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral-50 text-coral-700">
          <Rocket className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-bold">{s.title}</h2>
          <p className="text-xs text-slate-500">{s.sub(done, steps.length)}</p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper" aria-hidden="true">
        <div className="h-full rounded-full bg-coral-600 transition-all" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ul className="mt-3 space-y-1">
        {steps.map((st) => (
          <li key={st.key}>
            <Link
              to={st.to}
              className={`flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm transition ${st.done ? 'text-slate-400 line-through' : 'font-semibold text-slate-700 hover:bg-paper hover:text-brand-800'}`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${st.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white'}`}
                aria-hidden="true"
              >
                {st.done && <Check className="h-3 w-3" />}
              </span>
              {s.steps[st.key]}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
