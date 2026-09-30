import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlarmClock, ArrowRight, BookOpen, Bookmark, PartyPopper, Search, Send, UserRoundCheck, X, type LucideIcon } from 'lucide-react';
import { backend } from './backend';
import { useAuth } from './AuthContext';
import { applyFilters, readFilters } from './filters';
import type { Profile, SavedSearch } from './types';
import { prepProgress } from './checklist';
import { useData } from './DataContext';
import { useAppText } from './text';
import { DeadlineChip, Notice, useDismissed } from './ui';
import { daysUntil } from './util';

/** One cell of the stats strip; `hot` tints the cell (e.g. deadlines this week). */
function Stat({ to, Icon, value, label, tone, hot = false }: { to: string; Icon: LucideIcon; value: number; label: string; tone: string; hot?: boolean }) {
  return (
    <Link
      to={to}
      className={`flex flex-col gap-2 p-3.5 transition sm:flex-row sm:items-center sm:gap-3.5 sm:px-5 sm:py-4 ${hot ? 'bg-amber-50 hover:bg-amber-100/60' : 'bg-white hover:bg-paper'}`}
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
 * Top of the opportunities page for signed-in users: a greeting, where their
 * applications stand, and the saved opportunities whose deadlines are coming up.
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

  // The profile card leaves for good once the profile is complete or the user closes it.
  const [completenessClosed, closeCompleteness] = useDismissed('profile-completeness');
  const [newHereClosed, closeNewHere] = useDismissed('new-here');
  const profileDone = !!profile && completeness(profile).percent >= 100;
  useEffect(() => {
    if (profileDone && !completenessClosed) closeCompleteness();
  }, [profileDone, completenessClosed]); // eslint-disable-line react-hooks/exhaustive-deps
  const showCompleteness = !!profile && !profileDone && !completenessClosed;

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

  return (
    <section aria-labelledby="dash-title">
      <h1 id="dash-title" className="text-3xl font-extrabold tracking-tight sm:text-[2.75rem] sm:leading-[1.1]">
        {tx.dash.hello(firstName)}
      </h1>
      <p className="mt-2 text-slate-600 sm:text-lg">{tx.dash.sub(openCount, fits)}</p>

      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
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
        <div className={`min-w-0 rounded-3xl border border-line bg-white p-5 sm:p-6 ${showCompleteness ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
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
            <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-sm text-slate-600">{tx.dash.upcomingEmpty}</p>
          ) : (
            <ul className="mt-4 divide-y divide-line/70">
              {pending.slice(0, 4).map(({ o, item }) => {
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
                    <DeadlineChip deadline={o.deadline} />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {showCompleteness && profile && <ProfileCompleteness profile={profile} onClose={closeCompleteness} />}
      </div>

      {tracked.length === 0 && !newHereClosed && (
        <div className="mt-4">
          <Notice
            icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
            onClose={closeNewHere}
            action={
              <Link to="/guides" className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline">
                {tx.nav.guides}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          >
            {tx.newHere}
          </Notice>
        </div>
      )}
    </section>
  );
}

type CompletenessKey = 'photo' | 'interests' | 'country' | 'headline' | 'about';

function completeness(p: Profile) {
  const checks: [CompletenessKey, boolean][] = [
    ['photo', !!p.avatar_url],
    ['interests', p.interests.length > 0],
    ['country', !!p.country],
    ['headline', !!p.headline?.trim()],
    ['about', !!p.about?.trim()],
  ];
  const missing = checks.filter(([, ok]) => !ok).map(([k]) => k);
  return { percent: Math.round(((checks.length - missing.length) / checks.length) * 100), missing };
}

/** "Your profile is 60% complete" with what's missing. */
function ProfileCompleteness({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const { tx } = useAppText();
  const { percent, missing } = completeness(profile);
  return (
    <div className="relative min-w-0 rounded-3xl border border-line bg-white p-5 sm:p-6">
      <button
        type="button"
        onClick={onClose}
        aria-label={tx.close}
        title={tx.close}
        className="absolute right-3 top-3 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
      <div className="flex items-center gap-3 pr-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <UserRoundCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-lg font-bold">{tx.complete.title(percent)}</h2>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper" aria-hidden="true">
        <div className="h-full rounded-full bg-brand-700" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-3 text-sm text-slate-600">{tx.complete.sub}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {missing.map((k) => (
          <span key={k} className="rounded-full bg-paper px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            + {tx.complete.items[k]}
          </span>
        ))}
      </div>
      <Link to="/app/profile" className="btn-secondary mt-4 w-full !py-2 text-sm">
        {tx.complete.cta}
      </Link>
    </div>
  );
}
