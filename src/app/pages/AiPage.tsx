import { Link } from 'react-router-dom';
import { ArrowRight, Check, ClipboardCheck, Crown, PenLine, Search, Sparkles, UserRound, type LucideIcon } from 'lucide-react';
import { AiQuota, useAiInfo } from '../AiTools';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { hasPremium } from '../plans';
import { useAppText } from '../text';
import { DeadlineChip, ProgramBadge, Spinner } from '../ui';
import { daysUntil } from '../util';

type AiStatus = 'locked' | 'checking' | 'active' | 'soon';

/** Coloured pill telling whether the AI can be used right now. */
export function AiStatusPill({ status, className = '' }: { status: AiStatus; className?: string }) {
  const { tx } = useAppText();
  const h = tx.aiHub;
  const look: Record<AiStatus, [string, string, string]> = {
    active: ['bg-emerald-100 text-emerald-800', 'bg-emerald-500', h.statusActive],
    soon: ['bg-violet-100 text-violet-800', 'bg-violet-500', h.statusSoon],
    checking: ['bg-slate-100 text-slate-600', 'bg-slate-400', h.statusChecking],
    locked: ['bg-amber-100 text-amber-800', 'bg-amber-500', h.statusLocked],
  };
  const [box, dot, label] = look[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${box} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot} ${status === 'active' ? 'animate-pulse' : ''}`} aria-hidden="true" />
      {label}
    </span>
  );
}

/**
 * The AI's state for the signed-in user: still checking, active or not set up yet.
 * Everyone with a regular account can use it (free: 1 a day, Premium: 15); 'locked'
 * is left for when today's uses have run out.
 */
export function useAiStatus(): AiStatus {
  const { profile } = useAuth();
  const info = useAiInfo(!!profile);
  if (!info) return 'checking';
  if (!info.configured) return 'soon';
  return info.remaining === 0 ? 'locked' : 'active';
}

function ToolCard({ Icon, title, points, tone }: { Icon: LucideIcon; title: string; points: string[]; tone: string }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6">
      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-bold">{title}</h2>
      <ul className="mt-3 space-y-2">
        {points.map((p) => (
          <li key={p} className="flex gap-2 text-sm text-slate-600">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * /app/ai — the AI assistant's home: what it does, whether it's on, and a quick
 * way into the letter or review tool for each tracked opportunity. The tools
 * themselves live on the opportunity page (/o/:id?tab=letter|review).
 */
export default function AiPage() {
  const { tx } = useAppText();
  const h = tx.aiHub;
  const { profile } = useAuth();
  const { opportunities, saved } = useData();
  const status = useAiStatus();
  const info = useAiInfo(!!profile);
  // Free accounts see what Premium adds (15 uses a day instead of 1).
  const free = !hasPremium(profile);

  if (!opportunities || !profile) return <Spinner label={tx.loading} />;

  const tracked = opportunities
    .filter((o) => {
      const item = saved.get(o.id);
      return item && (item.status === 'saved' || item.status === 'applied') && daysUntil(o.deadline) >= 0;
    })
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
  const aboutLength = profile.about?.trim().length ?? 0;

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-700 via-indigo-800 to-brand-950 p-6 text-white shadow-soft sm:p-8 lg:p-10">
        <span className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-fuchsia-400/30 blur-3xl" aria-hidden="true" />
        <span className="pointer-events-none absolute -bottom-28 left-10 h-56 w-56 rounded-full bg-brand-400/20 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-bold">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {tx.nav.ai}
          </span>
          <AiStatusPill status={status} />
          {info?.limit != null && <span className="text-sm text-violet-100">{h.perDay(info.limit)}</span>}
        </div>
        <h1 className="relative mt-4 max-w-2xl text-3xl font-extrabold tracking-tight !text-white sm:text-4xl">{h.title}</h1>
        <p className="relative mt-2 max-w-2xl leading-relaxed text-violet-100 sm:text-lg">{h.sub}</p>
        {status === 'soon' && <p className="relative mt-4 max-w-2xl rounded-2xl bg-white/10 px-4 py-3 text-sm text-violet-50">{tx.ai.comingSoon}</p>}
      </header>

      <AiQuota info={info} />

      {free && (
        <div className="flex flex-col gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:p-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-coral-600 text-white">
            <Crown className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-extrabold text-amber-950">{h.lockedTitle}</h2>
            <p className="mt-1 text-sm text-amber-900">{h.lockedText}</p>
          </div>
          <Link to="/app/profile?tab=premium" className="btn-primary shrink-0">
            {h.lockedCta}
          </Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <ToolCard Icon={PenLine} title={h.letterTitle} points={h.letterPoints} tone="bg-violet-100 text-violet-700" />
        <ToolCard Icon={ClipboardCheck} title={h.reviewTitle} points={h.reviewPoints} tone="bg-brand-50 text-brand-700" />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <section className="min-w-0 rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6 lg:col-span-2" aria-labelledby="ai-pick">
          <h2 id="ai-pick" className="text-xl font-bold">
            {h.pickTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{h.pickSub}</p>
          {tracked.length === 0 ? (
            <div className="mt-4 flex flex-col items-start gap-3 rounded-2xl bg-paper p-4">
              <p className="text-sm text-slate-600">{h.pickEmpty}</p>
              <Link to="/app" className="btn-secondary !py-2 text-sm">
                <Search className="h-4 w-4" aria-hidden="true" />
                {h.pickFind}
              </Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line/70">
              {tracked.map((o) => (
                <li key={o.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <ProgramBadge program={o.program} />
                    <div className="min-w-0">
                      <Link to={`/o/${o.id}`} className="block truncate font-bold text-ink hover:text-brand-700">
                        {o.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm text-slate-500">{o.program}</span>
                        <DeadlineChip deadline={o.deadline} />
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link
                      to={`/o/${o.id}?tab=letter`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-violet-700 px-3.5 py-2 text-sm font-bold text-white transition hover:bg-violet-800"
                    >
                      <PenLine className="h-4 w-4" aria-hidden="true" />
                      {h.write}
                    </Link>
                    <Link
                      to={`/o/${o.id}?tab=review`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-sm font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
                    >
                      <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                      {h.review}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-4">
          <section className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="font-bold">{h.aboutTitle}</h2>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper" aria-hidden="true">
              <div className="h-full rounded-full bg-brand-700 transition-all" style={{ width: `${Math.min(100, (aboutLength / 400) * 100)}%` }} />
            </div>
            <p className="mt-3 text-sm text-slate-600">{aboutLength ? h.aboutFilled(aboutLength) : h.aboutEmpty}</p>
            <Link to="/app/profile" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline">
              {h.aboutCta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>

          <section className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold">{h.howTitle}</h2>
            <ol className="mt-3 space-y-3">
              {h.how.map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-extrabold text-violet-700">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink">{step.title}</span>
                    <span className="block text-sm text-slate-500">{step.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
