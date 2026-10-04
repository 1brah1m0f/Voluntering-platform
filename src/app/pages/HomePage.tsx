import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlarmClock, ArrowRight, BookOpen, Clock, Compass, Layers, type LucideIcon } from 'lucide-react';
import { GUIDES } from '../../content/guides';
import { PROGRAM_PAGES } from '../../content/programs';
import { programLogo } from '../../lib/programs';
import { backend } from '../backend';
import { useAuth } from '../AuthContext';
import { Dashboard } from '../Dashboard';
import { useData } from '../DataContext';
import { matchScore } from '../match';
import { ageFit } from '../personal';
import { hasPremium } from '../plans';
import { useAppText } from '../text';
import type { Opportunity, SavedSearch } from '../types';
import { DeadlineChip, ErrorState, ProgramBadge, SaveButton, Spinner } from '../ui';
import { daysUntil } from '../util';
import { OpportunityCard } from './OpportunitiesPage';

function SectionTitle({ id, Icon, title, sub, action }: { id: string; Icon: LucideIcon; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id={id} className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <Icon className="h-6 w-6 text-brand-600" aria-hidden="true" />
          {title}
        </h2>
        {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * /app/home — the signed-in home: the next deadline and the coming two weeks,
 * this week's prep plan, picks that follow the profile's preferences, the
 * programmes, what's closing soon and the guides. Searching lives on /app.
 */
export default function HomePage() {
  const { tx, lang } = useAppText();
  const { profile } = useAuth();
  const { opportunities, saved, error, reload } = useData();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  useEffect(() => {
    if (!profile) return;
    backend.listSearches().then(setSearches, (err) => console.error('[searches] load failed', err));
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const interests = profile?.interests ?? [];
  const prefs = profile?.prefs ?? {};
  const published = useMemo(() => (opportunities ?? []).filter((o) => o.published), [opportunities]);
  const open = published.filter((o) => daysUntil(o.deadline) >= 0);
  const fits = interests.length ? open.filter((o) => o.interests.some((i) => interests.includes(i))).length : 0;
  const matches = useMemo(() => (hasPremium(profile) && profile ? new Map(published.map((o) => [o.id, matchScore(o, profile)])) : null), [profile, published]);

  // What the profile says the user wants, for everyone (the % score itself is Premium).
  const suits = (o: Opportunity) =>
    (interests.length === 0 || o.interests.some((i) => interests.includes(i))) &&
    (!prefs.kinds?.length || prefs.kinds.includes(o.kind)) &&
    (!prefs.funded_only || o.costs === 'full') &&
    ageFit(o, prefs.birth_year) !== 'young' &&
    ageFit(o, prefs.birth_year) !== 'old';
  const candidates = open.filter((o) => !saved.has(o.id) && suits(o));
  // Best match (Premium) or soonest deadline first.
  const picked = [...candidates].sort((a, b) => (matches ? matches.get(b.id)!.score - matches.get(a.id)!.score : 0) || a.deadline.localeCompare(b.deadline)).slice(0, 3);
  // Worth a look before it's too late: closing within two weeks, not among the picks.
  const closingSoon = candidates
    .filter((o) => daysUntil(o.deadline) <= 14 && !picked.some((p) => p.id === o.id))
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 4);
  const suggested = [...candidates].sort((a, b) => a.deadline.localeCompare(b.deadline))[0];

  if (error) return <ErrorState onRetry={reload} />;
  if (!opportunities) return <Spinner label={tx.loading} />;

  return (
    <div>
      <Dashboard openCount={open.length} fits={fits} searches={searches} setSearches={setSearches} suggested={suggested} />

      <section className="mt-12" aria-labelledby="picked-title">
        <SectionTitle
          id="picked-title"
          Icon={Compass}
          title={tx.list.picked}
          action={
            <Link to="/app" className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline">
              {tx.list.seeAll}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />
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

      <section className="mt-12" aria-labelledby="programs-title">
        <SectionTitle id="programs-title" Icon={Layers} title={tx.dash.programsTitle} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {PROGRAM_PAGES.map((p) => {
            const n = open.filter((o) => o.program === p.name).length;
            const logo = programLogo(p.name);
            return (
              <Link
                key={p.slug}
                to={`/programs/${p.slug}`}
                className={`group relative flex min-h-[9.5rem] flex-col overflow-hidden rounded-3xl bg-gradient-to-br p-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-card ${p.tone}`}
              >
                <span className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" aria-hidden="true" />
                {logo && (
                  <span className="flex h-10 w-16 items-center justify-center rounded-xl bg-white p-1.5">
                    <img src={logo} alt="" className="max-h-full max-w-full object-contain" />
                  </span>
                )}
                <span className="mt-auto pt-4 font-extrabold leading-tight">{p.name}</span>
                <span className="mt-0.5 line-clamp-1 text-xs text-white/80">{p.text[lang].tagline}</span>
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-bold">
                  {tx.dash.programsOpen(n)}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {closingSoon.length > 0 && (
        <section className="mt-12" aria-labelledby="closing-title">
          <SectionTitle id="closing-title" Icon={AlarmClock} title={tx.dash.closingTitle} sub={tx.dash.closingSub} />
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

      <section className="mt-12" aria-labelledby="guides-title">
        <SectionTitle
          id="guides-title"
          Icon={BookOpen}
          title={tx.dash.guidesTitle}
          action={
            <Link to="/guides" className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline">
              {tx.learn.allGuides}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {GUIDES.map((g, i) => (
            <Link
              key={g.slug}
              to={`/guides/${g.slug}`}
              className="group flex flex-col rounded-3xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl font-display font-extrabold ${['bg-brand-50 text-brand-700', 'bg-coral-50 text-coral-700', 'bg-violet-100 text-violet-700', 'bg-amber-100 text-amber-800'][i % 4]}`}>
                {i + 1}
              </span>
              <span className="mt-3 font-bold leading-snug text-ink group-hover:text-brand-800">{g.text[lang].title}</span>
              <span className="mt-1 line-clamp-2 text-sm text-slate-500">{g.text[lang].summary}</span>
              <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-semibold text-slate-500">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {tx.learn.minutes(g.minutes)}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
