import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bookmark, CalendarDays, ChevronRight, Map as MapIcon, PartyPopper, Search, Send, Sparkles, type LucideIcon } from 'lucide-react';
import { useAiInfo } from '../AiTools';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { matchScore } from '../match';
import { NotesMini } from '../Notes';
import { ageFit } from '../personal';
import { hasPremium } from '../plans';
import { useAppText } from '../text';
import type { Opportunity } from '../types';
import { DeadlineChip, ErrorState, ProgramBadge, SaveButton, Spinner } from '../ui';
import { daysUntil } from '../util';

/** A plain white card with a title row. */
function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-bold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SeeAll({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-brand-700 hover:underline">
      {label}
      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
    </Link>
  );
}

/** One opportunity as a compact row. */
function Row({ o, match, saveButton = false }: { o: Opportunity; match?: number; saveButton?: boolean }) {
  const { tx } = useAppText();
  return (
    <li className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      <ProgramBadge program={o.program} />
      <div className="min-w-0 flex-1">
        <Link to={`/o/${o.id}`} className="line-clamp-1 text-sm font-bold text-ink hover:text-brand-700">
          {o.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="truncate text-slate-500">{o.is_online ? tx.list.online : o.country || o.program}</span>
          <DeadlineChip deadline={o.deadline} />
          {match !== undefined && <span className="rounded-full bg-violet-50 px-2 py-0.5 font-bold text-violet-700">{tx.list.match(match)}</span>}
        </div>
      </div>
      {saveButton && <SaveButton id={o.id} />}
    </li>
  );
}

/**
 * /app/home — kept simple: a greeting, three numbers, the user's deadlines,
 * a few picks, quick links and notes.
 */
export default function HomePage() {
  const { tx } = useAppText();
  const { profile } = useAuth();
  const { opportunities, saved, error, reload } = useData();
  const ai = useAiInfo(!!profile);

  const interests = profile?.interests ?? [];
  const prefs = profile?.prefs ?? {};
  const published = useMemo(() => (opportunities ?? []).filter((o) => o.published), [opportunities]);
  const open = published.filter((o) => daysUntil(o.deadline) >= 0);
  const matches = useMemo(() => (hasPremium(profile) && profile ? new Map(published.map((o) => [o.id, matchScore(o, profile).score])) : null), [profile, published]);

  if (error) return <ErrorState onRetry={reload} />;
  if (!opportunities || !profile) return <Spinner label={tx.loading} />;

  const items = [...saved.values()];
  const mine = published.filter((o) => saved.get(o.id)?.status === 'saved' && daysUntil(o.deadline) >= 0).sort((a, b) => a.deadline.localeCompare(b.deadline));
  const fits = interests.length ? open.filter((o) => o.interests.some((i) => interests.includes(i))).length : 0;
  // Picks: what the profile says the user wants, best match (Premium) or soonest first.
  const picks = open
    .filter((o) => {
      const age = ageFit(o, prefs.birth_year);
      return (
        !saved.has(o.id) &&
        (interests.length === 0 || o.interests.some((i) => interests.includes(i))) &&
        (!prefs.kinds?.length || prefs.kinds.includes(o.kind)) &&
        (!prefs.funded_only || o.costs === 'full') &&
        age !== 'young' &&
        age !== 'old'
      );
    })
    .sort((a, b) => (matches ? matches.get(b.id)! - matches.get(a.id)! : 0) || a.deadline.localeCompare(b.deadline))
    .slice(0, 5);

  const stats: { label: string; n: number; Icon: LucideIcon; tone: string }[] = [
    { label: tx.dash.saved, n: items.filter((i) => i.status === 'saved').length, Icon: Bookmark, tone: 'text-coral-600' },
    { label: tx.dash.applied, n: items.filter((i) => i.status === 'applied').length, Icon: Send, tone: 'text-brand-600' },
    { label: tx.dash.accepted, n: items.filter((i) => i.status === 'accepted').length, Icon: PartyPopper, tone: 'text-emerald-600' },
  ];
  const links: { to: string; label: string; sub: string; Icon: LucideIcon }[] = [
    { to: '/app', label: tx.nav.opportunities, sub: tx.list.sub(open.length), Icon: Search },
    { to: '/app/map', label: tx.nav.map, sub: tx.map.sub, Icon: MapIcon },
    { to: '/app/ai', label: tx.nav.ai, sub: ai?.limit != null && ai.remaining != null ? tx.ai.quota(ai.remaining, ai.limit) : tx.dash.aiSub, Icon: Sparkles },
    { to: '/app/calendar', label: tx.nav.calendar, sub: tx.calendar.sub, Icon: CalendarDays },
  ];
  const firstName = profile.full_name.trim().split(/\s+/)[0] ?? '';

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{tx.dash.hello(firstName)}</h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">{tx.dash.sub(open.length, fits)}</p>
      </header>

      <Link to="/app/tracker" className="grid grid-cols-3 divide-x divide-line rounded-3xl border border-line bg-white shadow-sm transition hover:border-brand-200">
        {stats.map(({ label, n, Icon, tone }) => (
          <div key={label} className="flex flex-col items-center gap-1 px-2 py-4 text-center sm:flex-row sm:justify-center sm:gap-3">
            <Icon className={`h-5 w-5 ${tone}`} aria-hidden="true" />
            <div>
              <p className="font-display text-2xl font-extrabold leading-none text-ink">{n}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </Link>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          <Card title={tx.dash.upcoming} action={mine.length > 0 ? <SeeAll to="/app/tracker" label={tx.dash.allTracked} /> : undefined}>
            {mine.length === 0 ? (
              <p className="rounded-2xl bg-paper px-4 py-3 text-sm text-slate-600">{tx.dash.upcomingEmpty}</p>
            ) : (
              <ul className="divide-y divide-line/70">
                {mine.slice(0, 5).map((o) => (
                  <Row key={o.id} o={o} />
                ))}
              </ul>
            )}
          </Card>

          <Card title={tx.list.picked} action={<SeeAll to="/app" label={tx.list.seeAll} />}>
            {picks.length === 0 ? (
              <p className="rounded-2xl bg-paper px-4 py-3 text-sm text-slate-600">{tx.list.empty}</p>
            ) : (
              <ul className="divide-y divide-line/70">
                {picks.map((o) => (
                  <Row key={o.id} o={o} match={matches?.get(o.id)} saveButton />
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="min-w-0 space-y-5">
          <nav aria-label={tx.dash.shortcutsTitle} className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
            {links.map(({ to, label, sub, Icon }) => (
              <Link key={to} to={to} className="flex items-center gap-3 border-b border-line/70 px-4 py-3 transition last:border-0 hover:bg-paper">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-ink">{label}</span>
                  <span className="block truncate text-xs text-slate-500">{sub}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              </Link>
            ))}
          </nav>
          <NotesMini />
        </div>
      </div>
    </div>
  );
}
