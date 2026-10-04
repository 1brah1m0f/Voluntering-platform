import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Bookmark, BookOpen, FileText, Flame, Globe2, ListChecks, MapPin, PartyPopper, Search, Send, Sparkles, UserRound, Wallet } from 'lucide-react';
import { GUIDES } from '../../content/guides';
import { useAiInfo } from '../AiTools';
import { useAuth } from '../AuthContext';
import { backend } from '../backend';
import { useData } from '../DataContext';
import { matchScore, type MatchReason } from '../match';
import { AiStatusPill, useAiStatus } from './AiPage';
import { THEMES, ageFit } from '../personal';
import { hasPremium } from '../plans';
import { completeness } from '../profileProgress';
import { KINDS } from '../taxonomy';
import { useAppText } from '../text';
import type { Kind, Opportunity, SavedSearch } from '../types';
import { Avatar, DeadlineChip, ErrorState, ProgramBadge, SaveButton, Spinner } from '../ui';
import { daysUntil } from '../util';

type Match = { score: number; reasons: MatchReason[] };
type FeedTab = 'forYou' | 'latest' | 'closing';

const isNew = (o: Opportunity) => Date.now() - new Date(o.created_at).getTime() < 3 * 86_400_000;

function Widget({ title, Icon, children, action }: { title: string; Icon: typeof Search; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-bold">
          <Icon className="h-4 w-4 text-brand-600" aria-hidden="true" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** One opportunity in the feed: logo, programme and type, title, place, funding, deadline, fit. */
function FeedItem({ o, match }: { o: Opportunity; match?: Match }) {
  const { tx, lang } = useAppText();
  return (
    <li className="group flex gap-4 rounded-3xl border border-line bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-card sm:p-5">
      <ProgramBadge program={o.program} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-500">
          <span className="text-brand-700">{o.program}</span>
          <span aria-hidden="true">·</span>
          <span>{KINDS[o.kind][lang]}</span>
          {isNew(o) && <span className="rounded-full bg-coral-600 px-2 py-0.5 text-[0.6875rem] font-bold uppercase text-white">{tx.list.newBadge}</span>}
        </p>
        <Link to={`/o/${o.id}`} className="mt-1 line-clamp-2 block text-lg font-bold leading-snug text-ink group-hover:text-brand-800">
          {o.title}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 font-medium text-slate-600">
            {o.is_online ? <Globe2 className="h-3.5 w-3.5" aria-hidden="true" /> : <MapPin className="h-3.5 w-3.5" aria-hidden="true" />}
            {o.is_online ? tx.list.online : [o.city, o.country].filter(Boolean).join(', ') || '—'}
          </span>
          {o.costs === 'full' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-800">
              <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
              {tx.list.fullyFunded}
            </span>
          )}
          <DeadlineChip deadline={o.deadline} />
          {match && <span className="rounded-full bg-violet-50 px-2.5 py-0.5 font-bold text-violet-700">{tx.list.match(match.score)}</span>}
        </div>
      </div>
      <div className="shrink-0 self-start">
        <SaveButton id={o.id} />
      </div>
    </li>
  );
}

/** The top match, shown big above the feed. */
function Featured({ o, match }: { o: Opportunity; match?: Match }) {
  const { tx, lang } = useAppText();
  const f = tx.feed;
  return (
    <article className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-6 text-white shadow-soft sm:p-7">
      <span className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-coral-500/80" aria-hidden="true" />
      <div className="relative flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">
          <Flame className="h-3.5 w-3.5 text-coral-300" aria-hidden="true" />
          {f.featured}
        </span>
        {match && <span className="rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-brand-900">{tx.list.match(match.score)}</span>}
      </div>
      <p className="relative mt-4 text-sm font-semibold text-brand-200">
        {o.program} · {KINDS[o.kind][lang]}
      </p>
      <Link to={`/o/${o.id}`} className="relative mt-1 block max-w-xl text-2xl font-extrabold leading-tight tracking-tight !text-white hover:underline sm:text-3xl">
        {o.title}
      </Link>
      {o.description && <p className="relative mt-3 line-clamp-2 max-w-xl text-sm leading-relaxed text-brand-100">{o.description}</p>}
      <div className="relative mt-5 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {o.is_online ? tx.list.online : [o.city, o.country].filter(Boolean).join(', ') || '—'}
        </span>
        {o.costs === 'full' && <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">{tx.list.fullyFunded}</span>}
        <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-brand-900">{tx.daysLeft(daysUntil(o.deadline))}</span>
        <Link to={`/o/${o.id}`} className="ml-auto inline-flex items-center gap-1 rounded-full bg-coral-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-coral-600">
          {tx.home.deck.more}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

/** LinkedIn-style card: cover in the profile colour, photo, name, strength, application counts. */
function ProfileCard({ searches }: { searches: SavedSearch[] }) {
  const { tx } = useAppText();
  const f = tx.feed;
  const { profile } = useAuth();
  const { saved } = useData();
  const navigate = useNavigate();
  if (!profile) return null;
  const items = [...saved.values()];
  const strength = completeness(profile).percent;
  const theme = THEMES[profile.prefs?.theme ?? 'teal'] ?? THEMES.teal;
  const stats = [
    { label: tx.dash.saved, n: items.filter((i) => i.status === 'saved').length, Icon: Bookmark },
    { label: tx.dash.applied, n: items.filter((i) => i.status === 'applied').length, Icon: Send },
    { label: tx.dash.accepted, n: items.filter((i) => i.status === 'accepted').length, Icon: PartyPopper },
  ];
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
        <div className={`h-16 bg-gradient-to-br ${theme.cover}`} />
        <div className="px-5 pb-5">
          <Link to="/app/profile" className="-mt-9 block w-fit">
            <Avatar profile={profile} className="h-[4.5rem] w-[4.5rem] text-xl ring-4 ring-white" />
          </Link>
          <Link to="/app/profile" className="mt-2 block truncate font-extrabold text-ink hover:text-brand-700">
            {profile.full_name || profile.email}
          </Link>
          {profile.headline && <p className="truncate text-sm text-slate-500">{profile.headline}</p>}
          {strength < 100 && (
            <Link to="/app/profile" className="mt-3 block">
              <span className="flex justify-between text-xs font-semibold text-slate-600">
                {tx.dash.profileStrength(strength)}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-paper">
                <span className="block h-full rounded-full bg-coral-500" style={{ width: `${strength}%` }} />
              </span>
            </Link>
          )}
        </div>
        <ul className="border-t border-line">
          {stats.map(({ label, n, Icon }) => (
            <li key={label}>
              <Link to="/app/tracker" className="flex items-center justify-between px-5 py-2.5 text-sm transition hover:bg-paper">
                <span className="inline-flex items-center gap-2 text-slate-600">
                  <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {label}
                </span>
                <span className="font-bold text-ink">{n}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-3 border-t border-line text-center text-xs font-semibold">
          {(
            [
              ['/app/profile', f.links.profile, UserRound],
              ['/app/cv', f.links.cv, FileText],
              ['/app/tracker', f.links.tracker, ListChecks],
            ] as const
          ).map(([to, label, Icon]) => (
            <Link key={to} to={to} className="flex flex-col items-center gap-1 px-1 py-3 text-slate-600 transition hover:bg-paper hover:text-brand-700">
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </div>
      </section>
      {searches.length > 0 && (
        <Widget title={tx.home.searches} Icon={Search}>
          <ul className="space-y-1">
            {searches.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    backend.markSearchSeen(s.id).catch((err) => console.error('[searches] mark seen failed', err));
                    navigate(`/app?${s.params}`);
                  }}
                  className="w-full truncate rounded-xl px-2 py-1.5 text-left text-sm font-semibold text-slate-700 hover:bg-paper hover:text-brand-700"
                >
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        </Widget>
      )}
    </div>
  );
}

/**
 * /app/home — built like the opportunity sites young people already know
 * (search, categories with counts, a feed, deadlines approaching, browse by
 * country, tips), with a personal profile card and widgets around the feed.
 */
export default function HomePage() {
  const { tx, lang } = useAppText();
  const f = tx.feed;
  const { profile } = useAuth();
  const { opportunities, saved, error, reload } = useData();
  const navigate = useNavigate();
  const aiStatus = useAiStatus();
  const aiInfo = useAiInfo(!!profile);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<FeedTab>('forYou');
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
  const forYou = open
    .filter((o) => !saved.has(o.id) && suits(o))
    .sort((a, b) => (matches ? matches.get(b.id)!.score - matches.get(a.id)!.score : 0) || a.deadline.localeCompare(b.deadline));
  const featured = forYou[0];
  const feeds: Record<FeedTab, Opportunity[]> = {
    forYou: forYou.slice(1),
    latest: [...open].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    closing: open.filter((o) => daysUntil(o.deadline) <= 14).sort((a, b) => a.deadline.localeCompare(b.deadline)),
  };
  const mine = published
    .filter((o) => saved.get(o.id)?.status === 'saved' && daysUntil(o.deadline) >= 0)
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

  if (error) return <ErrorState onRetry={reload} />;
  if (!opportunities || !profile) return <Spinner label={tx.loading} />;

  const categories: { label: string; to: string; n: number }[] = [
    ...(['youth_exchange', 'training', 'volunteering', 'seminar', 'online'] as Kind[]).map((k) => ({
      label: KINDS[k][lang],
      to: `/app?kind=${k}&mine=0`,
      n: open.filter((o) => o.kind === k).length,
    })),
    { label: tx.list.fullyFunded, to: '/app?funded=1&mine=0', n: open.filter((o) => o.costs === 'full').length },
    { label: tx.list.closingSoon, to: '/app?soon=1&mine=0', n: open.filter((o) => daysUntil(o.deadline) <= 7).length },
  ];
  const countries = Object.entries(
    open.filter((o) => !o.is_online && o.country).reduce<Record<string, number>>((acc, o) => ({ ...acc, [o.country]: (acc[o.country] ?? 0) + 1 }), {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const firstName = profile.full_name.trim().split(/\s+/)[0] ?? '';
  const search = (e: FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/app?q=${encodeURIComponent(q.trim())}&mine=0` : '/app');
  };
  const list = feeds[tab].slice(0, 8);

  return (
    <div>
      {/* Search + categories */}
      <section className="relative overflow-hidden rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-coral-50 p-6 sm:p-8">
        <span className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-coral-200/50 blur-2xl" aria-hidden="true" />
        <p className="relative text-sm font-semibold text-brand-700">{tx.dash.hello(firstName)}</p>
        <h1 className="relative mt-1 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{f.searchTitle}</h1>
        <form onSubmit={search} className="relative mt-5 flex max-w-2xl items-center gap-2 rounded-full border border-line bg-white p-1.5 shadow-card focus-within:ring-2 focus-within:ring-brand-300">
          <Search className="ml-3 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={f.searchPh}
            aria-label={f.searchTitle}
            className="min-w-0 flex-1 border-0 bg-transparent py-2 text-base outline-none focus:ring-0"
          />
          <button type="submit" className="btn-primary shrink-0 !px-6 !py-2.5">
            {f.searchBtn}
          </button>
        </form>
        <ul className="relative mt-5 flex flex-wrap gap-2">
          {categories.map((c) => (
            <li key={c.to}>
              <Link
                to={c.to}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-800"
              >
                {c.label}
                <span className="rounded-full bg-paper px-2 text-xs font-bold text-slate-500">{c.n}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] 2xl:grid-cols-[15rem_minmax(0,1fr)_18rem]">
        {/* Left: profile card */}
        <aside className="order-3 lg:order-none lg:col-start-2 lg:row-start-1 2xl:col-start-1 2xl:row-span-2">
          <ProfileCard searches={searches} />
        </aside>

        {/* Center: featured + feed */}
        <div className="order-1 min-w-0 space-y-4 lg:order-none lg:col-start-1 lg:row-span-2 lg:row-start-1 2xl:col-start-2">
          {featured && <Featured o={featured} match={matches?.get(featured.id)} />}
          <div role="tablist" aria-label={tx.nav.opportunities} className="flex gap-1 overflow-x-auto rounded-full border border-line bg-white p-1 shadow-sm">
            {(Object.keys(f.tabs) as FeedTab[]).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`flex-1 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${tab === t ? 'bg-brand-900 text-white' : 'text-slate-600 hover:text-ink'}`}
              >
                {f.tabs[t]}
                <span className={`ml-1.5 text-xs ${tab === t ? 'text-brand-200' : 'text-slate-400'}`}>{feeds[t].length}</span>
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-line py-12 text-center text-slate-500">{f.empty}</p>
          ) : (
            <ul className="space-y-3">
              {list.map((o) => (
                <FeedItem key={o.id} o={o} match={matches?.get(o.id)} />
              ))}
            </ul>
          )}
          <Link to="/app" className="btn-secondary w-full">
            {tx.list.seeAll}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Right: widgets */}
        <aside className="order-2 space-y-4 lg:order-none lg:col-start-2 lg:row-start-2 2xl:col-start-3 2xl:row-span-2 2xl:row-start-1">
          <Widget
            title={f.myDeadlines}
            Icon={Bookmark}
            action={
              <Link to="/app/tracker" className="text-xs font-bold text-brand-700 hover:underline">
                {tx.dash.allTracked}
              </Link>
            }
          >
            {mine.length === 0 ? (
              <p className="text-sm text-slate-500">{f.myDeadlinesEmpty}</p>
            ) : (
              <ul className="space-y-2.5">
                {mine.slice(0, 5).map((o) => (
                  <li key={o.id} className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-coral-50 leading-none text-coral-800">
                      <span className="text-[0.625rem] font-bold uppercase">{tx.calendar.months[Number(o.deadline.slice(5, 7)) - 1].slice(0, 3)}</span>
                      <span className="font-display text-lg font-extrabold">{Number(o.deadline.slice(8, 10))}</span>
                    </span>
                    <Link to={`/o/${o.id}`} className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink hover:text-brand-700">{o.title}</span>
                      <span className="block text-xs text-slate-500">{tx.daysLeft(daysUntil(o.deadline))}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Widget>

          <Link to="/app/ai" className="group block rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-700 to-indigo-950 p-5 text-white shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 font-bold">
                <Sparkles className="h-4 w-4 text-violet-200" aria-hidden="true" />
                {tx.nav.ai}
              </span>
              <AiStatusPill status={aiStatus} />
            </div>
            <p className="mt-2 text-sm text-violet-100">{f.aiSub}</p>
            {aiInfo?.limit != null && aiInfo.remaining != null && (
              <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold">{tx.ai.quota(aiInfo.remaining, aiInfo.limit)}</p>
            )}
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold">
              {f.aiOpen}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </Link>

          {countries.length > 0 && (
            <Widget title={f.countries} Icon={Globe2}>
              <ul className="space-y-1">
                {countries.map(([c, n]) => (
                  <li key={c}>
                    <Link to={`/app?country=${encodeURIComponent(c)}&mine=0`} className="flex items-center justify-between rounded-xl px-2 py-1.5 text-sm hover:bg-paper">
                      <span className="font-semibold text-slate-700">{c}</span>
                      <span className="text-xs font-bold text-slate-400">{n}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Widget>
          )}

          <Widget title={f.tips} Icon={BookOpen}>
            <ul className="space-y-1">
              {GUIDES.map((g) => (
                <li key={g.slug}>
                  <Link to={`/guides/${g.slug}`} className="group flex items-start gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-paper">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-brand-600" aria-hidden="true" />
                    <span className="font-semibold leading-snug text-slate-700 group-hover:text-brand-800">{g.text[lang].title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Widget>
        </aside>
      </div>
    </div>
  );
}
