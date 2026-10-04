import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { GUIDES } from '../../content/guides';
import { PROGRAM_PAGES } from '../../content/programs';
import { programLogo } from '../../lib/programs';
import { backend } from '../backend';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { AiTile, BadgesTile, CountdownTile, DiscoverDeck, PipelineTile, Tile, Timeline, TodoTile } from '../home/HomeTiles';
import { matchScore } from '../match';
import { ageFit } from '../personal';
import { hasPremium } from '../plans';
import { completeness } from '../profileProgress';
import { useAppText } from '../text';
import type { Opportunity, SavedSearch } from '../types';
import { Avatar, ErrorState, Spinner } from '../ui';
import { daysUntil } from '../util';

const dayPart = (): 'morning' | 'day' | 'evening' => {
  const h = new Date().getHours();
  return h >= 5 && h < 12 ? 'morning' : h >= 12 && h < 18 ? 'day' : 'evening';
};

/** A number in the briefing sentence that links somewhere. */
function Pill({ to, tone, children }: { to: string; tone: string; children: ReactNode }) {
  return (
    <Link to={to} className={`mx-0.5 inline-block rounded-full px-3 py-0.5 font-bold transition hover:-translate-y-0.5 ${tone}`}>
      {children}
    </Link>
  );
}

/** The user's photo inside a ring that shows how complete the profile is. */
function ProfileRing() {
  const { tx } = useAppText();
  const { profile } = useAuth();
  if (!profile) return null;
  const p = completeness(profile).percent;
  const r = 46;
  const len = 2 * Math.PI * r;
  return (
    <Link to="/app/profile" className="group flex shrink-0 flex-col items-center gap-1.5" title={tx.home.profileRing(p)}>
      <span className="relative block h-28 w-28">
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#e4dfd3" strokeWidth="5" />
          <circle cx="50" cy="50" r={r} fill="none" stroke="#fb5d3b" strokeWidth="5" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - p / 100)} />
        </svg>
        <Avatar profile={profile} className="absolute inset-2.5 h-[5.75rem] w-[5.75rem] text-2xl transition group-hover:scale-105" />
      </span>
      <span className="text-xs font-bold text-slate-600 group-hover:text-coral-700">{tx.home.profileRing(p)}</span>
    </Link>
  );
}

/**
 * /app/home — a personal briefing (date, greeting, one sentence about the week),
 * then a bento grid: the Discover deck, next deadline, AI, application path,
 * achievements, next steps and programmes; the next 60 days on a line; guides.
 */
export default function HomePage() {
  const { tx, lang } = useAppText();
  const h = tx.home;
  const { profile } = useAuth();
  const { opportunities, saved, error, reload } = useData();
  const navigate = useNavigate();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  useEffect(() => {
    if (!profile) return;
    backend.listSearches().then(setSearches, (err) => console.error('[searches] load failed', err));
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const interests = profile?.interests ?? [];
  const prefs = profile?.prefs ?? {};
  const published = useMemo(() => (opportunities ?? []).filter((o) => o.published), [opportunities]);
  const open = published.filter((o) => daysUntil(o.deadline) >= 0);
  const matches = useMemo(() => (hasPremium(profile) && profile ? new Map(published.map((o) => [o.id, matchScore(o, profile)])) : null), [profile, published]);

  // What the profile says the user wants (interests, types, funded only, age).
  const suits = (o: Opportunity) => {
    const age = ageFit(o, prefs.birth_year);
    return (
      (interests.length === 0 || o.interests.some((i) => interests.includes(i))) &&
      (!prefs.kinds?.length || prefs.kinds.includes(o.kind)) &&
      (!prefs.funded_only || o.costs === 'full') &&
      age !== 'young' &&
      age !== 'old'
    );
  };
  // The deck: best match first (Premium), otherwise the soonest deadline.
  const candidates = open
    .filter((o) => !saved.has(o.id) && suits(o))
    .sort((a, b) => (matches ? matches.get(b.id)!.score - matches.get(a.id)!.score : 0) || a.deadline.localeCompare(b.deadline));

  const tracked = published.filter((o) => saved.has(o.id)).map((o) => ({ o, item: saved.get(o.id)! }));
  const pending = tracked.filter((r) => r.item.status === 'saved' && daysUntil(r.o.deadline) >= 0).sort((a, b) => a.o.deadline.localeCompare(b.o.deadline));
  const closing = pending.filter((r) => daysUntil(r.o.deadline) <= 7).length;
  const fresh = candidates.filter((o) => Date.now() - new Date(o.created_at).getTime() < 7 * 86_400_000).length;

  if (error) return <ErrorState onRetry={reload} />;
  if (!opportunities || !profile) return <Spinner label={tx.loading} />;

  const now = new Date();
  const firstName = profile.full_name.trim().split(/\s+/)[0] ?? '';
  const openSearch = (s: SavedSearch) => {
    backend.markSearchSeen(s.id).catch((err) => console.error('[searches] mark seen failed', err));
    navigate(`/app?${s.params}`);
  };

  return (
    <div>
      {/* Briefing */}
      <header className="flex flex-col-reverse gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-coral-700">
            {h.weekdays[now.getDay()]}, {now.getDate()} {tx.calendar.months[now.getMonth()]}
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl">{tx.dash.greet(dayPart(), firstName)}.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
            {closing || fresh ? (
              <>
                {h.brief.lead}{' '}
                <Pill to="/app/tracker" tone="bg-coral-100 text-coral-800">
                  {h.brief.deadlines(closing)}
                </Pill>{' '}
                {h.brief.mid}{' '}
                <Pill to="/app" tone="bg-brand-100 text-brand-900">
                  {h.brief.fresh(fresh)}
                </Pill>{' '}
                {h.brief.end}
              </>
            ) : (
              h.brief.calm
            )}
          </p>
          {searches.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{h.searches}</span>
              {searches.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => openSearch(s)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
                >
                  <Search className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <ProfileRing />
      </header>

      {/* Bento */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-flow-dense lg:grid-cols-4">
        <DiscoverDeck candidates={candidates} matches={matches} />
        <CountdownTile o={pending[0]?.o} />
        <AiTile />
        <PipelineTile items={[...saved.values()]} />
        <BadgesTile />
        <TodoTile pending={pending} />
        <Tile className="bg-brand-50 sm:col-span-2">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-extrabold text-brand-950">{h.programs}</h2>
            <Link to="/guides" className="text-sm font-bold text-brand-700 hover:underline">
              {tx.nav.guides}
            </Link>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {PROGRAM_PAGES.map((p) => {
              const n = open.filter((o) => o.program === p.name).length;
              const logo = programLogo(p.name);
              return (
                <li key={p.slug}>
                  <Link to={`/programs/${p.slug}`} className="group flex items-center gap-3 rounded-2xl bg-white p-3 transition hover:shadow-card">
                    <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-xl bg-white p-1 ring-1 ring-line">
                      {logo ? <img src={logo} alt="" className="max-h-full max-w-full object-contain" /> : <span className="text-xs font-extrabold">{p.name.slice(0, 2)}</span>}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-ink">{p.name}</span>
                      <span className="block text-xs text-slate-500">{tx.dash.programsOpen(n)}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-brand-700 transition group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Tile>
      </div>

      <Timeline tracked={tracked.filter((r) => r.item.status === 'saved' || r.item.status === 'applied').map((r) => r.o)} suggested={candidates} />

      {/* Guides */}
      <section className="mt-10" aria-labelledby="guides-title">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="guides-title" className="font-display text-2xl font-extrabold tracking-tight">
            {h.guides}
          </h2>
          <Link to="/guides" className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline">
            {tx.learn.allGuides}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <ol className="mt-4 grid gap-x-8 gap-y-1 md:grid-cols-2">
          {GUIDES.map((g, i) => (
            <li key={g.slug}>
              <Link to={`/guides/${g.slug}`} className="group flex items-baseline gap-4 border-b border-line py-4">
                <span className="font-display text-3xl font-extrabold text-coral-500/70 group-hover:text-coral-600">{String(i + 1).padStart(2, '0')}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-ink group-hover:text-brand-800">{g.text[lang].title}</span>
                  <span className="mt-0.5 block text-xs font-semibold text-slate-500">{tx.learn.minutes(g.minutes)}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 self-center text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand-700" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
