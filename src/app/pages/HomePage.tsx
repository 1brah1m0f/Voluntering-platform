import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Search } from 'lucide-react';
import { backend } from '../backend';
import { useAuth } from '../AuthContext';
import { Dashboard } from '../Dashboard';
import { useData } from '../DataContext';
import { matchScore } from '../match';
import { hasPremium } from '../plans';
import { useAppText } from '../text';
import type { SavedSearch } from '../types';
import { ErrorState, Spinner } from '../ui';
import { daysUntil } from '../util';
import { OpportunityCard } from './OpportunitiesPage';

/**
 * /app/home — the signed-in home: where the user's applications stand, their
 * saved searches and a few picks. Searching and filtering live on /app.
 */
export default function HomePage() {
  const { tx } = useAppText();
  const { profile } = useAuth();
  const { opportunities, error, reload } = useData();
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

  if (error) return <ErrorState onRetry={reload} />;
  if (!opportunities) return <Spinner label={tx.loading} />;

  const shortcuts = [
    { to: '/app', Icon: Search, label: tx.nav.opportunities, sub: tx.list.sub(open.length) },
    { to: '/app/calendar', Icon: CalendarDays, label: tx.nav.calendar, sub: tx.calendar.sub },
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

      <nav className="mt-10 grid gap-3 sm:grid-cols-3" aria-label={tx.nav.home}>
        {shortcuts.map(({ to, Icon, label, sub }) => (
          <Link key={to} to={to} className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-4 transition hover:border-brand-200">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-ink">{label}</span>
              <span className="block truncate text-sm text-slate-500">{sub}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-brand-700 transition group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        ))}
      </nav>
    </div>
  );
}
