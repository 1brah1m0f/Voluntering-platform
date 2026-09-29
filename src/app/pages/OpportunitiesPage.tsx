import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BookmarkPlus, Crown, Globe2, Lock, MapPin, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { backend } from '../backend';
import { ONLINE, applyFilters, filterQuery, readFilters } from '../filters';
import { Dashboard } from '../Dashboard';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { COSTS, INTERESTS, KINDS, type InterestId } from '../taxonomy';
import { useAppText } from '../text';
import { PREMIUM_EARLY_HOURS, type Kind, type Opportunity, type SavedSearch } from '../types';
import { GOOD_MATCH, matchScore, type MatchReason } from '../match';
import { Chip, DeadlineChip, ErrorState, Notice, ProgramBadge, SaveButton, Spinner, inputClass, useDismissed } from '../ui';
import { daysUntil } from '../util';

function MatchBadge({ score, reasons }: { score: number; reasons: MatchReason[] }) {
  const { tx } = useAppText();
  const tone = score >= 80 ? 'bg-emerald-100 text-emerald-800' : score >= GOOD_MATCH ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-slate-600';
  const why = reasons.map((r) => tx.list.matchReasons[r]).join(' · ');
  return (
    <span title={why} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${tone}`}>
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      {tx.list.match(score)}
    </span>
  );
}

export function OpportunityCard({ o, match }: { o: Opportunity; match?: { score: number; reasons: MatchReason[] } }) {
  const { tx, lang } = useAppText();
  const closed = daysUntil(o.deadline) < 0;
  return (
    <article
      className={`group relative flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft ${closed ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        <ProgramBadge program={o.program} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-brand-700">{o.program}</p>
          <h3 className="mt-0.5 font-bold leading-snug text-slate-900">
            <Link to={`/o/${o.id}`} className="after:absolute after:inset-0 after:rounded-3xl focus:outline-none">
              {o.title}
            </Link>
          </h3>
        </div>
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1">
          {o.is_online ? <Globe2 className="h-3.5 w-3.5" aria-hidden="true" /> : <MapPin className="h-3.5 w-3.5" aria-hidden="true" />}
          {o.is_online ? tx.list.online : [o.city, o.country].filter(Boolean).join(', ')}
        </span>
        {!(o.is_online && o.kind === 'online') && <span>{KINDS[o.kind][lang]}</span>}
        {o.costs === 'full' && <span className="font-semibold text-emerald-700">{COSTS.full[lang]}</span>}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {match && <MatchBadge score={match.score} reasons={match.reasons} />}
        {o.interests.slice(0, 3).map((i) => (
          <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {INTERESTS[i as InterestId]?.[lang] ?? i}
          </span>
        ))}
        {!o.published && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">{tx.list.draft}</span>}
        {Date.now() - new Date(o.created_at).getTime() < PREMIUM_EARLY_HOURS * 3_600_000 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-100 to-coral-100 px-2 py-0.5 text-xs font-bold text-coral-800">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            {tx.list.newBadge}
          </span>
        )}
      </div>
      <div className="relative z-10 mt-auto flex items-center justify-between gap-2 pt-4">
        <DeadlineChip deadline={o.deadline} />
        <SaveButton id={o.id} withLabel />
      </div>
    </article>
  );
}

export default function OpportunitiesPage() {
  const { tx, lang } = useAppText();
  const { profile } = useAuth();
  const { opportunities, error, reload } = useData();
  const myInterests = profile?.interests ?? [];

  // Filters live in the URL, so they survive opening an opportunity and coming
  // back, and a filtered list can be shared as a link.
  const [params, setParams] = useSearchParams();
  const setParam = (key: string, value: string | null) =>
    setParams(
      (cur) => {
        const next = new URLSearchParams(cur);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  const flag = (key: string) => params.get(key) === '1';
  const filters = readFilters(params, myInterests);
  const { q: query, forYou, program, kind, country, soon, funded, showClosed } = filters;
  const sort = params.get('sort') === 'deadline' ? 'deadline' : 'best';
  const [filtersOpen, setFiltersOpen] = useState(false);
  const isPremium = profile?.plan === 'premium' || profile?.is_admin === true;
  const [earlyCount, setEarlyCount] = useState(0);
  const navigate = useNavigate();

  // Saved searches (signed-in users): chips on the dashboard, "Save this search" in the filter bar.
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [naming, setNaming] = useState<string | null>(null);
  const [searchMsg, setSearchMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    if (!profile) return;
    backend.listSearches().then(setSearches, (err) => console.error('[searches] load failed', err));
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isPremium) return;
    backend.premiumEarlyCount().then(setEarlyCount, () => setEarlyCount(0));
  }, [isPremium]);

  const toggle = (key: string) => () => setParam(key, flag(key) ? null : '1');
  /** Premium-only filters: free users are sent to the Premium page instead. */
  const premiumToggle = (key: string) => () => (isPremium ? toggle(key)() : navigate('/app/profile?tab=premium'));

  const published = useMemo(() => (opportunities ?? []).filter((o) => o.published), [opportunities]);
  const programs = useMemo(() => [...new Set(published.map((o) => o.program))].sort(), [published]);
  const countries = useMemo(() => [...new Set(published.filter((o) => !o.is_online && o.country).map((o) => o.country))].sort((a, b) => a.localeCompare(b, 'az')), [published]);
  const openCount = published.filter((o) => daysUntil(o.deadline) >= 0).length;

  const q = query.trim().toLowerCase();
  const results = applyFilters(published, filters, myInterests);

  // Premium smart matching: fit score per card, "best match" ordering, and a
  // personal "N new opportunities for you" summary.
  const matches = useMemo(() => (isPremium && profile ? new Map(published.map((o) => [o.id, matchScore(o, profile)])) : null), [isPremium, profile, published]);
  const ordered = matches && sort === 'best' ? [...results].sort((a, b) => matches.get(b.id)!.score - matches.get(a.id)!.score || a.deadline.localeCompare(b.deadline)) : results;
  const weekAgo = Date.now() - 7 * 86_400_000;
  const freshForYou = matches ? published.filter((o) => daysUntil(o.deadline) >= 0 && new Date(o.created_at).getTime() > weekAgo && matches.get(o.id)!.score >= GOOD_MATCH) : [];
  const soonestDays = freshForYou.length ? Math.min(...freshForYou.map((o) => daysUntil(o.deadline))) : null;

  // Info strips above the list. Each can be closed and stays closed; the
  // "new for you" one comes back only when a newer matching opportunity appears.
  const newestFresh = freshForYou.reduce((m, o) => (o.created_at > m ? o.created_at : m), '');
  const [guestClosed, closeGuest] = useDismissed('guest-signup');
  const [interestsClosed, closeInterests] = useDismissed('pick-interests');
  const [freshClosed, closeFresh] = useDismissed(`fresh:${newestFresh}`);
  const [earlyClosed, closeEarly] = useDismissed('early-teaser');
  const smallBtn = 'btn-primary !px-4 !py-1.5 text-sm';
  const notices = [
    !profile && !guestClosed && (
      <Notice
        key="guest"
        icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
        onClose={closeGuest}
        action={
          <Link to="/register" className={smallBtn}>
            {tx.guest.signUp}
          </Link>
        }
      >
        {tx.guest.listBanner}
      </Notice>
    ),
    profile && myInterests.length === 0 && !interestsClosed && (
      <Notice
        key="interests"
        icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
        onClose={closeInterests}
        action={
          <Link to="/app/profile" className={smallBtn}>
            {tx.list.pickInterests}
          </Link>
        }
      >
        {tx.list.noInterests}
      </Notice>
    ),
    freshForYou.length > 0 && !freshClosed && (
      <Notice key="fresh" tone="violet" icon={<Sparkles className="h-4 w-4" aria-hidden="true" />} onClose={closeFresh}>
        <span className="font-bold">{tx.list.forYouTitle(freshForYou.length)}</span>
        {soonestDays !== null && soonestDays <= 14 && <span> — {tx.list.forYouSoon(soonestDays)}</span>}
      </Notice>
    ),
    !isPremium && earlyCount > 0 && !earlyClosed && (
      <Notice
        key="early"
        tone="amber"
        icon={<Lock className="h-4 w-4" aria-hidden="true" />}
        onClose={closeEarly}
        action={
          <Link
            to="/app/profile?tab=premium"
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-amber-600"
          >
            <Crown className="h-4 w-4" aria-hidden="true" />
            {tx.list.seePremium}
          </Link>
        }
      >
        {tx.list.earlyTeaser(earlyCount)}
      </Notice>
    ),
  ].filter(Boolean);

  const anyFilter = q || program || kind || country || soon || funded || showClosed || (forYou && myInterests.length > 0);
  const clear = () => setParams(myInterests.length ? { mine: '0' } : {}, { replace: true });
  const currentQuery = filterQuery(params);
  const alreadySaved = searches.some((s) => s.params === currentQuery);
  const suggestName = () =>
    [query.trim(), program, kind ? KINDS[kind][lang] : '', country === ONLINE ? tx.list.online : country].filter(Boolean).join(' · ').slice(0, 60) || tx.searches.fallbackName;
  const saveSearch = async () => {
    const name = (naming ?? '').trim() || tx.searches.fallbackName;
    try {
      const s = await backend.saveSearch(name.slice(0, 60), currentQuery);
      setSearches((cur) => [...cur, s]);
      setNaming(null);
      setSearchMsg({ ok: true, text: tx.searches.saved });
      setTimeout(() => setSearchMsg(null), 4000);
    } catch (err) {
      console.error('[searches] save failed', err);
      setSearchMsg({ ok: false, text: searches.length >= 10 ? tx.searches.limit : tx.saveError });
    }
  };
  // Selects and chips (not the search box) that are switched on, for the mobile "Filters (n)" button.
  const activeFilters = [program, kind, country, soon, funded, showClosed].filter(Boolean).length;
  const fits = myInterests.length ? published.filter((o) => daysUntil(o.deadline) >= 0 && o.interests.some((i) => myInterests.includes(i))).length : 0;

  if (error) return <ErrorState onRetry={reload} />;
  if (!opportunities) return <Spinner label={tx.loading} />;

  return (
    <div>
      {profile ? (
        <Dashboard openCount={openCount} fits={fits} searches={searches} setSearches={setSearches} />
      ) : (
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{tx.list.title}</h1>
          <p className="text-slate-600">{tx.list.sub(openCount)}</p>
        </div>
      )}

      {notices.length > 0 && <div className="mt-5 space-y-2">{notices}</div>}

      {profile && (
        <div className="mt-8 flex items-baseline justify-between gap-2">
          <h2 className="text-xl font-extrabold tracking-tight">{tx.list.allTitle}</h2>
          <p className="text-sm text-slate-500">{tx.list.sub(openCount)}</p>
        </div>
      )}

      <div className="mt-4 space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex gap-2">
          <label className="relative block flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setParam('q', e.target.value)}
              placeholder={tx.list.search}
              aria-label={tx.list.search}
              className={`${inputClass} pl-10`}
            />
          </label>
          {/* Phones: the filters fold behind one button so the list starts sooner. */}
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold sm:hidden ${filtersOpen || activeFilters ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-slate-200 text-slate-700'}`}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {tx.list.filters}
            {activeFilters > 0 && <span className="rounded-full bg-brand-700 px-1.5 text-xs font-bold text-white">{activeFilters}</span>}
          </button>
        </div>
        <div className={`${filtersOpen ? 'grid' : 'hidden'} gap-2 sm:grid sm:grid-cols-3`}>
          <select value={program} onChange={(e) => setParam('program', e.target.value)} className={inputClass} aria-label={tx.detail.program}>
            <option value="">{tx.list.allPrograms}</option>
            {programs.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select value={kind} onChange={(e) => setParam('kind', e.target.value)} className={inputClass} aria-label={tx.detail.type}>
            <option value="">{tx.list.allKinds}</option>
            {(Object.keys(KINDS) as Kind[]).map((k) => (
              <option key={k} value={k}>
                {KINDS[k][lang]}
              </option>
            ))}
          </select>
          <select value={country} onChange={(e) => setParam('country', e.target.value)} className={inputClass} aria-label={tx.detail.where}>
            <option value="">{tx.list.allCountries}</option>
            <option value={ONLINE}>{tx.list.online}</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className={`${filtersOpen ? 'flex' : 'hidden'} flex-wrap items-center gap-2 sm:flex`}>
          {myInterests.length > 0 && (
            <Chip on={forYou} onClick={() => setParam('mine', forYou ? '0' : null)}>
              {tx.list.forYou}
            </Chip>
          )}
          <Chip on={soon} onClick={premiumToggle('soon')} title={isPremium ? undefined : tx.list.premiumFilter}>
            {!isPremium && <Lock className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />}
            {tx.list.closingSoon}
          </Chip>
          <Chip on={funded} onClick={premiumToggle('funded')} title={isPremium ? undefined : tx.list.premiumFilter}>
            {!isPremium && <Lock className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />}
            {tx.list.fullyFunded}
          </Chip>
          <Chip on={showClosed} onClick={toggle('closed')}>
            {tx.list.showClosed}
          </Chip>
          {anyFilter && (
            <button type="button" onClick={clear} className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-rose-600">
              <X className="h-4 w-4" aria-hidden="true" />
              {tx.list.clear}
            </button>
          )}
        </div>
      </div>

      {profile && currentQuery && currentQuery !== 'mine=0' && !alreadySaved && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {naming === null ? (
            <button
              type="button"
              onClick={() => {
                setSearchMsg(null);
                setNaming(suggestName());
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
            >
              <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
              {tx.searches.save}
            </button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void saveSearch();
              }}
              className="flex w-full flex-wrap items-center gap-2 sm:w-auto"
            >
              <input
                autoFocus
                value={naming}
                maxLength={60}
                onChange={(e) => setNaming(e.target.value)}
                placeholder={tx.searches.namePh}
                aria-label={tx.searches.namePh}
                className={`${inputClass} !py-1.5 sm:w-72`}
              />
              <button type="submit" className="btn-primary !px-4 !py-1.5 text-sm">
                {tx.searches.saveBtn}
              </button>
              <button type="button" onClick={() => setNaming(null)} className="text-sm font-semibold text-slate-500 hover:text-slate-800">
                {tx.searches.cancel}
              </button>
            </form>
          )}
        </div>
      )}
      {searchMsg && (
        <p role="status" className={`mt-2 text-sm font-medium ${searchMsg.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
          {searchMsg.text}
        </p>
      )}

      {matches && results.length > 1 && (
        <div className="mt-5 flex justify-end">
          <div role="group" className="inline-flex rounded-full bg-white p-1 text-sm shadow-sm ring-1 ring-slate-200">
            {(['best', 'deadline'] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={sort === k}
                onClick={() => setParam('sort', k === 'deadline' ? 'deadline' : null)}
                className={`rounded-full px-3 py-1 font-semibold transition ${sort === k ? 'bg-violet-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {k === 'best' ? tx.list.sortBest : tx.list.sortDeadline}
              </button>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 ? (
        <p className="mt-10 rounded-3xl border border-dashed border-slate-300 py-14 text-center text-slate-500">{tx.list.empty}</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {ordered.map((o) => (
            <OpportunityCard key={o.id} o={o} match={matches?.get(o.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
