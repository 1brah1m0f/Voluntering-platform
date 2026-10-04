import { Link, useNavigate } from 'react-router-dom';
import {
  AlarmClock,
  ArrowRight,
  Bookmark,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Crown,
  ExternalLink,
  PartyPopper,
  PenLine,
  Rocket,
  Search,
  Send,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-react';
import { backend } from './backend';
import { useAuth } from './AuthContext';
import { applyFilters, readFilters } from './filters';
import type { Opportunity, SavedItem, SavedSearch } from './types';
import { prepItems, type PrepItem } from './checklist';
import { useData } from './DataContext';
import { AiStatusPill, useAiStatus } from './pages/AiPage';
import { badges, visitedCountries } from './personal';
import { isPaidPlan } from './plans';
import { completeness } from './profileProgress';
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

const dayPart = (): 'morning' | 'day' | 'evening' => {
  const h = new Date().getHours();
  return h >= 5 && h < 12 ? 'morning' : h >= 12 && h < 18 ? 'day' : 'evening';
};

/** YYYY-MM-DD, `offset` days from today (local time). */
function isoInDays(offset: number) {
  const t = new Date();
  const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Top of the signed-in home: greeting with the next deadline, the next two weeks
 * at a glance, where applications stand, this week's prep plan, the AI assistant,
 * getting started and achievements.
 */
export function Dashboard({
  openCount,
  fits,
  searches,
  setSearches,
  suggested,
}: {
  openCount: number;
  fits: number;
  searches: SavedSearch[];
  setSearches: (fn: (cur: SavedSearch[]) => SavedSearch[]) => void;
  /** Best open opportunity for the user, shown as the next deadline when nothing is saved. */
  suggested?: Opportunity;
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
  const strength = profile ? completeness(profile).percent : 0;
  const next = pending[0]?.o ?? suggested;

  return (
    <section aria-labelledby="dash-title">
      <div className="relative overflow-hidden rounded-[2rem] bg-brand-900 p-6 text-white shadow-soft sm:p-8 lg:p-10">
        {/* The sun and ring from the logo. Decorative. */}
        <span className="pointer-events-none absolute -top-32 right-1/3 hidden h-60 w-60 rounded-full bg-coral-500/80 lg:block" aria-hidden="true" />
        <span className="pointer-events-none absolute -bottom-40 -left-24 h-72 w-72 rounded-full border-[22px] border-brand-800" aria-hidden="true" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className={`rounded-full px-2.5 py-1 ${premium ? 'bg-amber-300 text-amber-950' : 'bg-white/15 text-white'}`}>{premium ? `✦ ${tx.profile.premium}` : tx.profile.basic}</span>
              {strength < 100 && (
                <Link to="/app/profile" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-brand-100 hover:bg-white/20">
                  {tx.dash.profileStrength(strength)}
                  <span className="h-1.5 w-12 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
                    <span className="block h-full rounded-full bg-coral-300" style={{ width: `${strength}%` }} />
                  </span>
                </Link>
              )}
            </div>
            <h1 id="dash-title" className="mt-3 text-3xl font-extrabold tracking-tight !text-white sm:text-[2.75rem] sm:leading-[1.1]">
              {tx.dash.greet(dayPart(), firstName)} 👋
            </h1>
            <p className="mt-2 max-w-xl text-brand-100 sm:text-lg">{tx.dash.sub(openCount, fits)}</p>
            <div className="mt-6 flex flex-wrap gap-2">
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
          <NextDeadline o={next} isSaved={!!pending[0]} />
        </div>
      </div>

      <WeekStrip opportunities={published} saved={saved} />

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
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
        <WeekPlan pending={pending} premium={premium} hasTracked={tracked.length > 0} />
        <div className="min-w-0 space-y-4">
          <AiCard nextId={pending[0]?.o.id} nextTitle={pending[0]?.o.title} />
          <GettingStarted searches={searches.length} />
          <BadgesMini />
        </div>
      </div>
    </section>
  );
}

/** The big countdown in the hero: the user's nearest saved deadline, or a suggestion. */
function NextDeadline({ o, isSaved }: { o?: Opportunity; isSaved: boolean }) {
  const { tx } = useAppText();
  if (!o) {
    return (
      <Link to="/app" className="relative block rounded-3xl border border-brand-700 bg-brand-800/80 p-5 text-sm text-brand-100 backdrop-blur hover:border-brand-500">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-200">{tx.dash.nextTitle}</p>
        <p className="mt-2">{tx.dash.nextNone}</p>
      </Link>
    );
  }
  const d = daysUntil(o.deadline);
  return (
    <Link to={`/o/${o.id}`} className="group relative block rounded-3xl border border-brand-700 bg-brand-800/80 p-5 backdrop-blur transition hover:border-brand-500">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-200">{tx.dash.nextTitle}</p>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.6875rem] font-bold text-brand-100">{isSaved ? tx.dash.nextSaved : tx.dash.nextSuggested}</span>
      </div>
      <p className="mt-3 flex items-baseline gap-2">
        <span className={`font-display text-5xl font-extrabold leading-none ${d <= 3 ? 'text-coral-300' : d <= 7 ? 'text-amber-200' : 'text-white'}`}>{tx.dash.nextDays(d)}</span>
        {d > 1 && <span className="text-brand-200">{tx.dash.nextLeft}</span>}
      </p>
      <p className="mt-3 line-clamp-2 font-bold text-white group-hover:underline">{o.title}</p>
      <p className="mt-0.5 truncate text-sm text-brand-200">{o.program}</p>
    </Link>
  );
}

/** Next 14 days: how many deadlines fall on each day; days with a saved one are orange. */
function WeekStrip({ opportunities, saved }: { opportunities: Opportunity[]; saved: Map<string, SavedItem> }) {
  const { tx } = useAppText();
  const days = Array.from({ length: 14 }, (_, i) => {
    const iso = isoInDays(i);
    const due = opportunities.filter((o) => o.deadline === iso);
    return { iso, i, total: due.length, mine: due.filter((o) => saved.has(o.id)).length };
  });
  const max = Math.max(1, ...days.map((d) => d.total));
  return (
    <Link to="/app/calendar" className="mt-4 block rounded-3xl border border-line bg-white p-4 shadow-sm transition hover:border-brand-200 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-bold">{tx.dash.weekTitle}</h2>
        <p className="text-xs text-slate-500">{tx.dash.weekSub}</p>
      </div>
      <ol className="mt-3 grid grid-cols-7 gap-1.5 sm:grid-cols-[repeat(14,minmax(0,1fr))]">
        {days.map(({ iso, i, total, mine }) => {
          const date = new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
          return (
            <li
              key={iso}
              className={`flex flex-col items-center rounded-xl px-1 py-2 text-center ${i === 0 ? 'bg-brand-900 text-white' : mine ? 'bg-coral-50 ring-1 ring-coral-200' : 'bg-paper/70'}`}
            >
              <span className={`text-[0.6875rem] font-bold uppercase ${i === 0 ? 'text-brand-200' : 'text-slate-500'}`}>{tx.calendar.weekdays[(date.getDay() + 6) % 7]}</span>
              <span className="font-display text-lg font-extrabold leading-tight">{date.getDate()}</span>
              <span className="mt-1 flex h-6 w-full items-end justify-center" aria-hidden="true">
                {total > 0 && (
                  <span className={`w-2 rounded-full ${mine ? 'bg-coral-500' : i === 0 ? 'bg-brand-300' : 'bg-brand-400'}`} style={{ height: `${Math.max(25, (total / max) * 100)}%` }} />
                )}
              </span>
              <span className={`text-[0.6875rem] font-bold ${total ? (i === 0 ? 'text-white' : 'text-slate-700') : 'text-transparent'}`}>{total || '·'}</span>
            </li>
          );
        })}
      </ol>
    </Link>
  );
}

/** This week's plan: the prep steps still open for the nearest saved opportunities, tickable here. */
function WeekPlan({ pending, premium, hasTracked }: { pending: { o: Opportunity; item: SavedItem }[]; premium: boolean; hasTracked: boolean }) {
  const { tx } = useAppText();
  const { updateTracking } = useData();
  const toggle = async (o: Opportunity, done: string[], i: PrepItem) => {
    const next = done.includes(i) ? done.filter((x) => x !== i) : [...done, i];
    try {
      await updateTracking(o.id, { checklist: next });
    } catch (err) {
      console.error('[plan] save failed', err);
      alert(tx.saveError);
    }
  };

  return (
    <div className="min-w-0 rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <ClipboardList className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-bold">{tx.dash.planTitle}</h2>
            <p className="text-sm text-slate-500">{tx.dash.planSub}</p>
          </div>
        </div>
        {hasTracked && (
          <Link to="/app/tracker" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            {tx.dash.allTracked}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
      {pending.length === 0 ? (
        <div className="mt-5 flex flex-col items-start gap-3 rounded-2xl bg-paper px-4 py-4 sm:flex-row sm:items-center">
          <Bookmark className="h-8 w-8 shrink-0 text-coral-600" aria-hidden="true" />
          <p className="flex-1 text-sm text-slate-600">{tx.dash.planEmpty}</p>
          <Link to="/app" className="btn-secondary shrink-0 !py-2 text-sm">
            {tx.dash.findCta}
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-4">
          {pending.slice(0, 4).map(({ o, item }) => {
            const done = item.checklist ?? [];
            const steps = prepItems(o);
            const left = steps.filter((s) => !done.includes(s));
            return (
              <li key={o.id} className="rounded-2xl border border-line/80 p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <DateStamp deadline={o.deadline} />
                  <div className="min-w-0 flex-1">
                    <Link to={`/o/${o.id}`} className="block truncate font-bold text-ink hover:text-brand-700">
                      {o.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <DeadlineChip deadline={o.deadline} />
                      <span className="text-xs font-medium text-slate-500">{tx.dash.prep(steps.length - left.length, steps.length)}</span>
                    </div>
                  </div>
                  {premium && (
                    <Link to={`/o/${o.id}?tab=letter`} className="hidden shrink-0 items-center gap-1 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-100 sm:inline-flex">
                      <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
                      {tx.aiHub.write}
                    </Link>
                  )}
                </div>
                {left.length === 0 ? (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      {tx.dash.planReady}
                    </span>
                    <a href={o.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-emerald-800 hover:underline">
                      {tx.dash.planApply}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </div>
                ) : (
                  <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                    {left.map((s) => (
                      <li key={s}>
                        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-paper/70 px-3 py-2 text-sm text-slate-800 transition hover:bg-brand-50">
                          <input type="checkbox" checked={false} onChange={() => toggle(o, done, s)} className="h-4 w-4 shrink-0 accent-brand-600" />
                          {tx.prep.items[s]}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
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

/** A row of the achievements: earned ones in colour, the rest faded. */
function BadgesMini() {
  const { tx } = useAppText();
  const { profile } = useAuth();
  const { opportunities, saved } = useData();
  if (!profile) return null;
  const accepted = (opportunities ?? []).filter((o) => saved.get(o.id)?.status === 'accepted');
  const list = badges(profile, [...saved.values()], visitedCountries(profile.prefs, accepted));
  const earned = list.filter((b) => b.earned).length;
  return (
    <Link to="/app/profile?tab=journey" className="block rounded-3xl border border-line bg-white p-5 shadow-sm transition hover:border-amber-200 sm:p-6">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-bold">{tx.dash.badgesTitle}</h2>
        <span className="text-xs font-bold text-amber-700">
          {earned}/{list.length}
        </span>
      </div>
      <ul className="mt-3 grid grid-cols-4 gap-2">
        {list.map((b) => (
          <li
            key={b.id}
            title={`${tx.journey.badges[b.id].name} — ${tx.journey.badges[b.id].how}`}
            className={`flex aspect-square items-center justify-center rounded-2xl text-2xl ${b.earned ? 'bg-amber-50 ring-1 ring-amber-200' : 'bg-paper opacity-40 grayscale'}`}
          >
            <span aria-hidden="true">{b.emoji}</span>
            <span className="sr-only">{tx.journey.badges[b.id].name}</span>
          </li>
        ))}
      </ul>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-700">
        {tx.dash.badgesMore}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </Link>
  );
}
