import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, Globe2, Lock, MapPin, Search, Sparkles, X } from 'lucide-react';
import { backend } from '../backend';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { COSTS, INTERESTS, KINDS, type InterestId } from '../taxonomy';
import { useAppText } from '../text';
import { PREMIUM_EARLY_HOURS, type Kind, type Opportunity } from '../types';
import { GOOD_MATCH, matchScore, type MatchReason } from '../match';
import { Chip, DeadlineChip, ErrorState, ProgramBadge, SaveButton, Spinner, inputClass } from '../ui';
import { daysUntil } from '../util';

const ONLINE = '__online__';

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
    <article className={`group relative flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft ${closed ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <ProgramBadge program={o.program} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-brand-700">{o.program}</p>
          <h3 className="mt-0.5 font-bold leading-snug text-slate-900">
            <Link to={`/app/o/${o.id}`} className="after:absolute after:inset-0 after:rounded-3xl focus:outline-none">
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

  const [query, setQuery] = useState('');
  const [forYou, setForYou] = useState(myInterests.length > 0);
  const [program, setProgram] = useState('');
  const [kind, setKind] = useState<Kind | ''>('');
  const [country, setCountry] = useState('');
  const [soon, setSoon] = useState(false);
  const [funded, setFunded] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [sort, setSort] = useState<'best' | 'deadline'>('best');
  const isPremium = profile?.plan === 'premium' || profile?.is_admin === true;
  const [earlyCount, setEarlyCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (isPremium) return;
    backend.premiumEarlyCount().then(setEarlyCount, () => setEarlyCount(0));
  }, [isPremium]);

  /** Premium-only filters: free users are sent to the Premium page instead. */
  const premiumToggle = (set: (fn: (v: boolean) => boolean) => void) => () => (isPremium ? set((v) => !v) : navigate('/app/premium'));

  const published = useMemo(() => (opportunities ?? []).filter((o) => o.published), [opportunities]);
  const programs = useMemo(() => [...new Set(published.map((o) => o.program))].sort(), [published]);
  const countries = useMemo(() => [...new Set(published.filter((o) => !o.is_online && o.country).map((o) => o.country))].sort((a, b) => a.localeCompare(b, 'az')), [published]);
  const openCount = published.filter((o) => daysUntil(o.deadline) >= 0).length;

  const q = query.trim().toLowerCase();
  const results = published.filter((o) => {
    const d = daysUntil(o.deadline);
    if (!showClosed && d < 0) return false;
    if (soon && (d < 0 || d > 7)) return false;
    if (funded && o.costs !== 'full') return false;
    if (program && o.program !== program) return false;
    if (kind && o.kind !== kind) return false;
    if (country === ONLINE ? !o.is_online : country && o.country !== country) return false;
    if (forYou && myInterests.length && !o.interests.some((i) => myInterests.includes(i))) return false;
    if (q && !`${o.title} ${o.program} ${o.organizer} ${o.country} ${o.city} ${o.description}`.toLowerCase().includes(q)) return false;
    return true;
  });

  // Premium smart matching: fit score per card, "best match" ordering, and a
  // personal "N new opportunities for you" summary.
  const matches = useMemo(
    () => (isPremium && profile ? new Map(published.map((o) => [o.id, matchScore(o, profile)])) : null),
    [isPremium, profile, published],
  );
  const ordered = matches && sort === 'best' ? [...results].sort((a, b) => matches.get(b.id)!.score - matches.get(a.id)!.score || a.deadline.localeCompare(b.deadline)) : results;
  const weekAgo = Date.now() - 7 * 86_400_000;
  const freshForYou = matches
    ? published.filter((o) => daysUntil(o.deadline) >= 0 && new Date(o.created_at).getTime() > weekAgo && matches.get(o.id)!.score >= GOOD_MATCH)
    : [];
  const soonestDays = freshForYou.length ? Math.min(...freshForYou.map((o) => daysUntil(o.deadline))) : null;

  const anyFilter = q || program || kind || country || soon || funded || showClosed || (forYou && myInterests.length > 0);
  const clear = () => {
    setQuery('');
    setProgram('');
    setKind('');
    setCountry('');
    setSoon(false);
    setFunded(false);
    setShowClosed(false);
    setForYou(false);
  };

  if (error) return <ErrorState onRetry={reload} />;
  if (!opportunities) return <Spinner label={tx.loading} />;

  return (
    <div>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{tx.list.title}</h1>
        <p className="text-slate-600">{tx.list.sub(openCount)}</p>
      </div>

      {myInterests.length === 0 && (
        <div className="mt-5 flex flex-col items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm font-medium text-brand-900">
            <Sparkles className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
            {tx.list.noInterests}
          </p>
          <Link to="/app/profile" className="btn-primary !px-4 !py-2 text-sm">
            {tx.list.pickInterests}
          </Link>
        </div>
      )}

      {freshForYou.length > 0 && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-brand-50 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-brand-700 text-white">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-sm text-violet-950">
            <span className="font-bold">{tx.list.forYouTitle(freshForYou.length)}</span>
            {soonestDays !== null && soonestDays <= 14 && <span> — {tx.list.forYouSoon(soonestDays)}</span>}
          </p>
        </div>
      )}

      {!isPremium && earlyCount > 0 && (
        <div className="mt-5 flex flex-col items-start gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-coral-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-900">
            <Lock className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            {tx.list.earlyTeaser(earlyCount)}
          </p>
          <Link to="/app/premium" className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-600">
            <Crown className="h-4 w-4" aria-hidden="true" />
            {tx.list.seePremium}
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tx.list.search} aria-label={tx.list.search} className={`${inputClass} pl-10`} />
        </label>
        <div className="grid gap-2 sm:grid-cols-3">
          <select value={program} onChange={(e) => setProgram(e.target.value)} className={inputClass} aria-label={tx.detail.program}>
            <option value="">{tx.list.allPrograms}</option>
            {programs.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select value={kind} onChange={(e) => setKind(e.target.value as Kind | '')} className={inputClass} aria-label={tx.detail.type}>
            <option value="">{tx.list.allKinds}</option>
            {(Object.keys(KINDS) as Kind[]).map((k) => (
              <option key={k} value={k}>
                {KINDS[k][lang]}
              </option>
            ))}
          </select>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} aria-label={tx.detail.where}>
            <option value="">{tx.list.allCountries}</option>
            <option value={ONLINE}>{tx.list.online}</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {myInterests.length > 0 && (
            <Chip on={forYou} onClick={() => setForYou((v) => !v)}>
              {tx.list.forYou}
            </Chip>
          )}
          <Chip on={soon} onClick={premiumToggle(setSoon)} title={isPremium ? undefined : tx.list.premiumFilter}>
            {!isPremium && <Lock className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />}
            {tx.list.closingSoon}
          </Chip>
          <Chip on={funded} onClick={premiumToggle(setFunded)} title={isPremium ? undefined : tx.list.premiumFilter}>
            {!isPremium && <Lock className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />}
            {tx.list.fullyFunded}
          </Chip>
          <Chip on={showClosed} onClick={() => setShowClosed((v) => !v)}>
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

      {matches && results.length > 1 && (
        <div className="mt-5 flex justify-end">
          <div role="group" className="inline-flex rounded-full bg-white p-1 text-sm shadow-sm ring-1 ring-slate-200">
            {(['best', 'deadline'] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={sort === k}
                onClick={() => setSort(k)}
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
