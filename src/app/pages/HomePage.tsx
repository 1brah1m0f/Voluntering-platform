import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlarmClock, ArrowRight, BookOpen, CalendarDays, Search, Sparkles } from 'lucide-react';
import { backend } from '../backend';
import { useAuth } from '../AuthContext';
import { Dashboard } from '../Dashboard';
import { useData } from '../DataContext';
import { matchScore } from '../match';
import { hasPremium } from '../plans';
import { useAppText } from '../text';
import type { SavedSearch } from '../types';
import { DeadlineChip, ErrorState, ProgramBadge, SaveButton, Spinner } from '../ui';
import { daysUntil } from '../util';
import { OpportunityCard } from './OpportunitiesPage';

/**
 * /app/home — the signed-in home: where the user's applications stand, their
 * saved searches and a few picks. Searching and filtering live on /app.
 */
export default function HomePage() {
  const { tx } = useAppText();
  const { profile } = useAuth();
  const { opportunities, saved, error, reload } = useData();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  useEffect(() => {
    if (!profile) return;
    backend.listSearches().then(setSearches, (err) => console.error('[searches] load failed', err));
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const interests = profile?.interests ?? [];
  const published = useMemo(() => (opportunities ?? []).filter((o) => o.published), [opportunities]);
  const open = published.filter((o) => daysUntil(o.deadline) >= 0);
  const fits = interests.length ? open.filter((o) => o.interests.some((i) => interests.includes(i))).length : 0;
  const matches = useMemo(() => (hasPremium(profile) && profile ? new Map(published.map((o) => [o.id, matchScore(o, profile)])) : null), [profile, published]);
  // Open ones in the user's interests: best match (Premium) or soonest deadline first.
  const picked = open
    .filter((o) => interests.length === 0 || o.interests.some((i) => interests.includes(i)))
    .sort((a, b) => (matches ? matches.get(b.id)!.score - matches.get(a.id)!.score : 0) || a.deadline.localeCompare(b.deadline))
    .slice(0, 3);

  // Worth a look before it's too late: in the user's interests, not saved, closing within two weeks.
  const closingSoon = open
    .filter((o) => !saved.has(o.id) && daysUntil(o.deadline) <= 14)
    .filter((o) => interests.length === 0 || o.interests.some((i) => interests.includes(i)))
    .filter((o) => !picked.some((p) => p.id === o.id))
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 4);

  if (error) return <ErrorState onRetry={reload} />;
  if (!opportunities) return <Spinner label={tx.loading} />;

  const shortcuts = [
    { to: '/app', Icon: Search, label: tx.nav.opportunities, sub: tx.list.sub(open.length), tone: 'bg-brand-50 text-brand-700' },
    { to: '/app/calendar', Icon: CalendarDays, label: tx.nav.calendar, sub: tx.calendar.sub, tone: 'bg-coral-50 text-coral-700' },
    { to: '/app/ai', Icon: Sparkles, label: tx.nav.ai, sub: tx.dash.aiSub, tone: 'bg-violet-100 text-violet-700' },
    { to: '/guides', Icon: BookOpen, label: tx.nav.guides, sub: tx.dash.guidesSub, tone: 'bg-amber-100 text-amber-800' },
  ];

  return (
    <div>
      <Dashboard openCount={open.length} fits={fits} searches={searches} setSearches={setSearches} />

      <section className="mt-10" aria-labelledby="picked-title">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="picked-title" className="text-2xl font-extrabold tracking-tight">
            {tx.list.picked}
          </h2>
          <Link to="/app" className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline">
            {tx.list.seeAll}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {picked.length === 0 ? (
          <p className="mt-4 rounded-3xl border border-dashed border-line py-10 text-center text-slate-500">{tx.list.empty}</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {picked.map((o) => (
              <OpportunityCard key={o.id} o={o} match={matches?.get(o.id)} />
            ))}
          </div>
        )}
      </section>

      {closingSoon.length > 0 && (
        <section className="mt-10" aria-labelledby="closing-title">
          <h2 id="closing-title" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <AlarmClock className="h-6 w-6 text-coral-600" aria-hidden="true" />
            {tx.dash.closingTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{tx.dash.closingSub}</p>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {closingSoon.map((o) => (
              <li key={o.id} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm transition hover:border-brand-200 sm:p-4">
                <ProgramBadge program={o.program} />
                <div className="min-w-0 flex-1">
                  <Link to={`/o/${o.id}`} className="block truncate font-bold text-ink hover:text-brand-700">
                    {o.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <DeadlineChip deadline={o.deadline} />
                    <span className="truncate text-xs text-slate-500">{o.is_online ? tx.list.online : o.country}</span>
                  </div>
                </div>
                <SaveButton id={o.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className="mt-10" aria-labelledby="shortcuts-title">
        <h2 id="shortcuts-title" className="text-sm font-bold uppercase tracking-wide text-slate-500">
          {tx.dash.shortcutsTitle}
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {shortcuts.map(({ to, Icon, label, sub, tone }) => (
            <Link key={to} to={to} className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-ink">{label}</span>
                <span className="block truncate text-sm text-slate-500">{sub}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-brand-700 transition group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
