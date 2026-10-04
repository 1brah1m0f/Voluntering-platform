import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bookmark, CalendarClock, Crown, ExternalLink, Loader2, MapPin, PartyPopper, RotateCcw, Send, Sparkles, Wallet, X } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { prepItems, type PrepItem } from '../checklist';
import { useData } from '../DataContext';
import type { MatchReason } from '../match';
import { AiStatusPill, useAiStatus } from '../pages/AiPage';
import { badges, visitedCountries } from '../personal';
import { programLogo } from '../../lib/programs';
import { KINDS } from '../taxonomy';
import { useAppText } from '../text';
import type { Kind, Opportunity, SavedItem } from '../types';
import { daysUntil } from '../util';

/** A colour per opportunity type, so the cards in the deck look different from each other. */
const KIND_TONE: Record<Kind, string> = {
  youth_exchange: 'from-coral-400 via-coral-500 to-rose-700',
  training: 'from-brand-500 via-brand-700 to-brand-950',
  volunteering: 'from-emerald-400 via-emerald-600 to-teal-900',
  seminar: 'from-violet-500 via-indigo-600 to-indigo-950',
  online: 'from-sky-400 via-blue-600 to-indigo-900',
  other: 'from-amber-400 via-orange-500 to-rose-700',
};

/** A bento tile: rounded, padded, with an optional title row. */
export function Tile({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`relative min-w-0 overflow-hidden rounded-[2rem] p-5 sm:p-6 ${className}`}>{children}</div>;
}

/** Opportunities the user skipped in the deck, remembered in this browser. */
function useSkipped(): [string[], (id: string) => void, () => void] {
  const { userId } = useAuth();
  const key = `openly_skipped:${userId ?? 'guest'}`;
  const read = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? '[]') as string[];
    } catch {
      return [];
    }
  };
  const [list, setList] = useState<string[]>(read);
  const write = (next: string[]) => {
    setList(next);
    try {
      localStorage.setItem(key, JSON.stringify(next.slice(-300)));
    } catch {
      /* storage blocked: remembered for this visit only */
    }
  };
  return [list, (id) => write([...list, id]), () => write([])];
}

/**
 * "Discover": one opportunity at a time as a big card, with the next ones
 * stacked behind. Save keeps it (it then leaves the deck), Skip hides it.
 */
export function DiscoverDeck({ candidates, matches }: { candidates: Opportunity[]; matches: Map<string, { score: number; reasons: MatchReason[] }> | null }) {
  const { tx, lang } = useAppText();
  const d = tx.home.deck;
  const { save } = useData();
  const [skipped, skip, resetSkipped] = useSkipped();
  const [busy, setBusy] = useState(false);
  const left = candidates.filter((o) => !skipped.includes(o.id));
  const current = left[0];

  const keep = async () => {
    if (!current) return;
    setBusy(true);
    try {
      await save(current.id); // on success it leaves the deck (it's saved now)
    } catch (err) {
      console.error('[deck] save failed', err);
      alert(tx.saveError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Tile className="flex flex-col bg-ink text-white sm:col-span-2 lg:row-span-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight !text-white">{d.title}</h2>
          <p className="mt-1 max-w-sm text-sm text-white/70">{d.sub}</p>
        </div>
        {current && <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{d.count(candidates.length - left.length + 1, candidates.length)}</span>}
      </div>

      {current ? (
        <div className="relative mt-5 flex flex-1 flex-col">
          {/* The next cards, peeking out behind the current one. */}
          {left.length > 2 && <div className={`absolute inset-x-6 -bottom-3 top-6 rotate-2 rounded-[1.75rem] bg-gradient-to-br opacity-40 ${KIND_TONE[left[2].kind]}`} aria-hidden="true" />}
          {left.length > 1 && <div className={`absolute inset-x-3 -bottom-1.5 top-3 -rotate-1 rounded-[1.75rem] bg-gradient-to-br opacity-70 ${KIND_TONE[left[1].kind]}`} aria-hidden="true" />}
          <article key={current.id} className={`relative flex min-h-[24rem] flex-1 animate-[row-in_0.35s_ease] flex-col rounded-[1.75rem] bg-gradient-to-br p-5 shadow-2xl sm:p-7 ${KIND_TONE[current.kind]}`}>
            <span className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10" aria-hidden="true" />
            <div className="relative flex items-center justify-between gap-3">
              <span className="inline-flex min-w-0 items-center gap-2 rounded-full bg-white/15 py-1 pl-1 pr-3 text-sm font-bold backdrop-blur">
                {programLogo(current.program) ? (
                  <span className="flex h-7 w-10 shrink-0 items-center justify-center rounded-full bg-white p-1">
                    <img src={programLogo(current.program)} alt="" className="max-h-full max-w-full object-contain" />
                  </span>
                ) : (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-extrabold text-ink">{current.program.slice(0, 2).toUpperCase()}</span>
                )}
                <span className="truncate">{current.program}</span>
              </span>
              {matches?.get(current.id) && (
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-ink">{tx.list.match(matches.get(current.id)!.score)}</span>
              )}
            </div>
            <h3 className="relative mt-6 line-clamp-3 text-2xl font-extrabold leading-tight tracking-tight !text-white sm:text-3xl">{current.title}</h3>
            <ul className="relative mt-4 flex flex-wrap gap-2 text-sm font-semibold">
              <li className="inline-flex items-center gap-1.5 rounded-full bg-black/15 px-3 py-1">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {current.is_online ? tx.list.online : [current.city, current.country].filter(Boolean).join(', ') || '—'}
              </li>
              <li className="rounded-full bg-black/15 px-3 py-1">{KINDS[current.kind][lang]}</li>
              {current.costs === 'full' && (
                <li className="inline-flex items-center gap-1.5 rounded-full bg-black/15 px-3 py-1">
                  <Wallet className="h-4 w-4" aria-hidden="true" />
                  {tx.list.fullyFunded}
                </li>
              )}
              <li className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-ink">
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                {tx.daysLeft(daysUntil(current.deadline))}
              </li>
            </ul>
            {current.description && <p className="relative mt-4 line-clamp-3 text-sm leading-relaxed text-white/85">{current.description}</p>}
            <div className="relative mt-auto flex items-center gap-2 pt-6">
              <button
                type="button"
                onClick={() => skip(current.id)}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-black/20 px-5 font-bold transition hover:bg-black/30"
              >
                <X className="h-5 w-5" aria-hidden="true" />
                {d.skip}
              </button>
              <Link to={`/o/${current.id}`} className="inline-flex h-12 items-center gap-1.5 rounded-full bg-white/15 px-4 font-bold transition hover:bg-white/25">
                {d.more}
              </Link>
              <button
                type="button"
                onClick={keep}
                disabled={busy}
                className="ml-auto inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-extrabold text-ink shadow-lg transition hover:scale-[1.03] disabled:opacity-70"
              >
                {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Bookmark className="h-5 w-5 text-coral-600" aria-hidden="true" />}
                {d.save}
              </button>
            </div>
          </article>
        </div>
      ) : (
        <div className="mt-5 flex flex-1 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/20 px-6 py-14 text-center">
          <PartyPopper className="h-12 w-12 text-coral-300" aria-hidden="true" />
          <p className="mt-4 text-xl font-extrabold">{d.doneTitle}</p>
          <p className="mt-1 max-w-xs text-sm text-white/70">{d.doneSub}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {skipped.length > 0 && (
              <button type="button" onClick={resetSkipped} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20">
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {d.reset}
              </button>
            )}
            <Link to="/app" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink">
              {d.browse}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </Tile>
  );
}

/** Ring that fills up as the nearest saved deadline gets closer. */
export function CountdownTile({ o }: { o?: Opportunity }) {
  const { tx } = useAppText();
  const c = tx.home.countdown;
  if (!o) {
    return (
      <Tile className="flex flex-col justify-between bg-coral-50">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral-700">{c.title}</p>
        <p className="mt-6 text-sm text-coral-900">{c.none}</p>
        <Link to="/app" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-coral-700 hover:underline">
          {c.noneCta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Tile>
    );
  }
  const d = daysUntil(o.deadline);
  const r = 42;
  const len = 2 * Math.PI * r;
  const fill = Math.min(1, Math.max(0.06, 1 - d / 30));
  const stroke = d <= 3 ? '#e8431f' : d <= 7 ? '#d97706' : '#1b7a85';
  return (
    <Link to={`/o/${o.id}`} className="group block">
      <Tile className="h-full bg-coral-50 transition group-hover:bg-coral-100/70">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral-700">{c.title}</p>
        <div className="mt-3 flex items-center gap-4">
          <svg viewBox="0 0 100 100" className="h-24 w-24 shrink-0 -rotate-90" aria-hidden="true">
            <circle cx="50" cy="50" r={r} fill="none" stroke="#ffd0c4" strokeWidth="9" />
            <circle cx="50" cy="50" r={r} fill="none" stroke={stroke} strokeWidth="9" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - fill)} />
            <text x="50" y="50" textAnchor="middle" dominantBaseline="central" transform="rotate(90 50 50)" className="fill-ink font-display text-[1.9rem] font-extrabold">
              {d}
            </text>
          </svg>
          <div className="min-w-0">
            <p className="font-display text-lg font-extrabold leading-tight text-ink">{tx.dash.nextDays(d)}</p>
            {d > 1 && <p className="text-sm text-coral-800">{tx.dash.nextLeft}</p>}
          </div>
        </div>
        <p className="mt-3 line-clamp-2 font-bold text-ink group-hover:underline">{o.title}</p>
      </Tile>
    </Link>
  );
}

/** Saved → applied → accepted as bars, with the rejections as a footnote. */
export function PipelineTile({ items }: { items: SavedItem[] }) {
  const { tx } = useAppText();
  const steps = [
    { key: 'saved', label: tx.dash.saved, Icon: Bookmark, bar: 'bg-coral-500', n: items.filter((i) => i.status === 'saved').length },
    { key: 'applied', label: tx.dash.applied, Icon: Send, bar: 'bg-brand-600', n: items.filter((i) => i.status === 'applied').length },
    { key: 'accepted', label: tx.dash.accepted, Icon: PartyPopper, bar: 'bg-emerald-500', n: items.filter((i) => i.status === 'accepted').length },
  ];
  const rejected = items.filter((i) => i.status === 'rejected').length;
  const max = Math.max(1, ...steps.map((s) => s.n));
  return (
    <Link to="/app/tracker" className="group block">
      <Tile className="h-full border border-line bg-white transition group-hover:border-brand-200">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">{tx.home.pipeline.title}</p>
        <ul className="mt-4 space-y-3">
          {steps.map(({ key, label, Icon, bar, n }) => (
            <li key={key}>
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                  <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {label}
                </span>
                <span className="font-display text-lg font-extrabold text-ink">{n}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper" aria-hidden="true">
                <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.max(n ? 8 : 0, (n / max) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
        {rejected > 0 && <p className="mt-3 text-xs text-slate-500">{tx.home.pipeline.rejected(rejected)}</p>}
      </Tile>
    </Link>
  );
}

/** The AI assistant in one dark violet tile. */
export function AiTile() {
  const { tx } = useAppText();
  const status = useAiStatus();
  const locked = status === 'locked';
  return (
    <Link to={locked ? '/app/profile?tab=premium' : '/app/ai'} className="group block">
      <Tile className="flex h-full flex-col bg-gradient-to-br from-violet-600 via-indigo-700 to-indigo-950 text-white">
        <span className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-fuchsia-400/30 blur-2xl" aria-hidden="true" />
        <div className="relative flex items-center justify-between gap-2">
          <Sparkles className="h-6 w-6 text-violet-200" aria-hidden="true" />
          <AiStatusPill status={status} />
        </div>
        <p className="relative mt-4 font-extrabold leading-snug">{tx.ai.title}</p>
        <p className="relative mt-1 line-clamp-3 text-sm text-violet-100">{locked ? tx.aiHub.lockedText : tx.ai.sub}</p>
        <span className="relative mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold">
          {locked && <Crown className="h-4 w-4 text-amber-300" aria-hidden="true" />}
          {locked ? tx.aiHub.lockedCta : tx.aiHub.dashCta}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </Tile>
    </Link>
  );
}

/** Achievements as a grid of emoji, earned ones lit up. */
export function BadgesTile() {
  const { tx } = useAppText();
  const { profile } = useAuth();
  const { opportunities, saved } = useData();
  if (!profile) return null;
  const accepted = (opportunities ?? []).filter((o) => saved.get(o.id)?.status === 'accepted');
  const list = badges(profile, [...saved.values()], visitedCountries(profile.prefs, accepted));
  const earned = list.filter((b) => b.earned).length;
  return (
    <Link to="/app/profile?tab=journey" className="group block">
      <Tile className="h-full bg-amber-50 transition group-hover:bg-amber-100/70">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-800">{tx.dash.badgesTitle}</p>
          <span className="font-display text-lg font-extrabold text-amber-900">
            {earned}/{list.length}
          </span>
        </div>
        <ul className="mt-4 grid grid-cols-4 gap-2">
          {list.map((b) => (
            <li
              key={b.id}
              title={`${tx.journey.badges[b.id].name} — ${tx.journey.badges[b.id].how}`}
              className={`flex aspect-square items-center justify-center rounded-2xl text-2xl ${b.earned ? 'bg-white shadow-sm' : 'bg-amber-100/60 opacity-40 grayscale'}`}
            >
              <span aria-hidden="true">{b.emoji}</span>
              <span className="sr-only">{tx.journey.badges[b.id].name}</span>
            </li>
          ))}
        </ul>
      </Tile>
    </Link>
  );
}

/** The next prep steps across saved opportunities, nearest deadline first; tick them off in place. */
export function TodoTile({ pending }: { pending: { o: Opportunity; item: SavedItem }[] }) {
  const { tx } = useAppText();
  const t = tx.home.todo;
  const { updateTracking } = useData();
  const tasks = pending.flatMap(({ o, item }) => prepItems(o).filter((s) => !(item.checklist ?? []).includes(s)).map((step) => ({ o, item, step }))).slice(0, 6);
  const toggle = async (o: Opportunity, item: SavedItem, step: PrepItem) => {
    try {
      await updateTracking(o.id, { checklist: [...(item.checklist ?? []), step] });
    } catch (err) {
      console.error('[todo] save failed', err);
      alert(tx.saveError);
    }
  };
  const ready = pending.filter(({ o, item }) => prepItems(o).every((s) => (item.checklist ?? []).includes(s)));

  return (
    <Tile className="border border-line bg-white sm:col-span-2">
      <h2 className="text-lg font-extrabold">{t.title}</h2>
      <p className="text-sm text-slate-500">{t.sub}</p>
      {tasks.length === 0 && ready.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-sm text-slate-600">{t.empty}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {ready.slice(0, 2).map(({ o }) => (
            <li key={`ready-${o.id}`} className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-3 py-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[0.6875rem] text-white" aria-hidden="true">
                ✓
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-emerald-900">
                {tx.dash.planReady} · {o.title}
              </span>
              <a href={o.url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-emerald-800 hover:underline">
                {tx.dash.planApply}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </li>
          ))}
          {tasks.map(({ o, item, step }) => (
            <li key={`${o.id}-${step}`}>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-paper/70 px-3 py-2.5 transition hover:bg-brand-50">
                <input type="checkbox" checked={false} onChange={() => toggle(o, item, step)} className="h-5 w-5 shrink-0 rounded-full accent-brand-600" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{tx.prep.items[step]}</span>
                  <span className="block truncate text-xs text-slate-500">{o.title}</span>
                </span>
                <span className="shrink-0 text-xs font-bold text-slate-500">{tx.daysLeft(daysUntil(o.deadline))}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </Tile>
  );
}

/** Next 60 days on one line: saved deadlines (orange) and good matches (green) as dots. */
export function Timeline({ tracked, suggested }: { tracked: Opportunity[]; suggested: Opportunity[] }) {
  const { tx } = useAppText();
  const t = tx.home.timeline;
  const SPAN = 60;
  const pos = (o: Opportunity) => `${(Math.min(SPAN, Math.max(0, daysUntil(o.deadline))) / SPAN) * 100}%`;
  const mine = tracked.filter((o) => daysUntil(o.deadline) >= 0 && daysUntil(o.deadline) <= SPAN).sort((a, b) => a.deadline.localeCompare(b.deadline));
  const other = suggested.filter((o) => daysUntil(o.deadline) >= 0 && daysUntil(o.deadline) <= SPAN).slice(0, 12);
  // Month starts inside the window, as labels on the line.
  const today = new Date();
  const months = [1, 2, 3]
    .map((k) => new Date(today.getFullYear(), today.getMonth() + k, 1))
    .map((m) => ({ label: tx.calendar.months[m.getMonth()], d: Math.round((m.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86_400_000) }))
    .filter((m) => m.d <= SPAN);

  return (
    <section className="mt-6 rounded-[2rem] border border-line bg-white p-5 sm:p-6" aria-labelledby="timeline-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="timeline-title" className="text-lg font-extrabold">
          {t.title}
        </h2>
        <p className="text-xs text-slate-500">{t.sub}</p>
      </div>
      <div className="-mx-5 mt-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <div className="relative h-40 min-w-[640px]">
          {/* the line */}
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-paper" aria-hidden="true" />
          <div className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-4 border-white bg-ink shadow" title={t.today} />
          <span className="absolute left-0 top-[calc(50%+14px)] text-[0.6875rem] font-bold uppercase text-ink">{t.today}</span>
          {months.map((m) => (
            <span key={m.label} className="absolute top-[calc(50%+14px)] -translate-x-1/2 text-[0.6875rem] font-bold uppercase text-slate-400" style={{ left: `${(m.d / SPAN) * 100}%` }}>
              {m.label.slice(0, 3)}
            </span>
          ))}
          {other.map((o) => (
            <Link
              key={o.id}
              to={`/o/${o.id}`}
              title={o.title}
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500 ring-2 ring-white transition hover:scale-150"
              style={{ left: pos(o) }}
            />
          ))}
          {mine.slice(0, 8).map((o, i) => (
            <Link
              key={o.id}
              to={`/o/${o.id}`}
              className={`group absolute flex -translate-x-1/2 flex-col items-center ${i % 2 ? 'top-[calc(50%-8px)]' : 'bottom-[calc(50%-8px)] flex-col-reverse'}`}
              style={{ left: pos(o) }}
            >
              <span className="h-4 w-4 rounded-full bg-coral-500 ring-4 ring-coral-100 transition group-hover:scale-125" />
              <span className="h-5 w-px bg-coral-300" aria-hidden="true" />
              <span className="max-w-[8.5rem] truncate rounded-lg bg-coral-50 px-2 py-1 text-xs font-bold text-coral-900 group-hover:bg-coral-100">{o.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
