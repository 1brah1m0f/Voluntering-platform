import { useState, type ReactNode } from 'react';
import { Bookmark, CalendarClock, Check, Loader2, RefreshCw } from 'lucide-react';
import { programLogo } from '../lib/programs';
import { useData } from './DataContext';
import { useAppText } from './text';
import { daysUntil } from './util';
import type { Profile, Status } from './types';

export const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200';

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500" role="status">
      <Loader2 className="h-5 w-5 animate-spin text-brand-600" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { tx } = useAppText();
  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center" role="alert">
      <p className="font-semibold text-rose-800">{tx.loadError}</p>
      <button type="button" onClick={onRetry} className="btn-secondary mt-4 py-2 text-sm">
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        {tx.retry}
      </button>
    </div>
  );
}

export function Field({ label, htmlFor, error, hint, children }: { label: string; htmlFor?: string; error?: string | null; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-semibold text-slate-800">
        {label}
        {hint && <span className="ml-1 font-normal text-slate-500">— {hint}</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-rose-700">{error}</p>}
    </div>
  );
}

export function Chip({ on, onClick, children, title }: { on: boolean; onClick: () => void; children: ReactNode; title?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
        on ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:text-brand-700'
      }`}
    >
      {on && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function ProgramBadge({ program, size = 'md' }: { program: string; size?: 'md' | 'lg' }) {
  const logo = programLogo(program);
  const box = size === 'lg' ? 'h-16 w-24' : 'h-12 w-16';
  if (logo) {
    return (
      <span className={`flex shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200 ${box}`}>
        <img src={logo} alt="" className="max-h-full max-w-full object-contain" />
      </span>
    );
  }
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-sm font-extrabold text-white ${box}`}>
      {program.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function DeadlineChip({ deadline }: { deadline: string }) {
  const { tx } = useAppText();
  const d = daysUntil(deadline);
  const tone = d < 0 ? 'bg-slate-100 text-slate-500' : d <= 3 ? 'bg-coral-100 text-coral-800' : d <= 7 ? 'bg-amber-100 text-amber-800' : 'bg-brand-50 text-brand-700';
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
      <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
      {tx.daysLeft(d)}
    </span>
  );
}

const statusTone: Record<Status, string> = {
  saved: 'bg-slate-100 text-slate-700',
  applied: 'bg-brand-100 text-brand-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
};

export function statusClass(s: Status) {
  return statusTone[s];
}

/** Bookmark toggle that adds/removes an opportunity from the tracker. */
export function SaveButton({ id, withLabel = false }: { id: string; withLabel?: boolean }) {
  const { tx } = useAppText();
  const { saved, save, unsave } = useData();
  const [busy, setBusy] = useState(false);
  const on = saved.has(id);

  const toggle = async () => {
    setBusy(true);
    try {
      if (on) await unsave(id);
      else await save(id);
    } catch (err) {
      console.error('[save] failed', err);
      alert(tx.saveError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={on}
      aria-label={on ? tx.card.saved : tx.card.save}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition disabled:opacity-60 ${
        on ? 'border-coral-200 bg-coral-50 text-coral-700' : 'border-slate-200 bg-white text-slate-600 hover:border-coral-200 hover:text-coral-700'
      }`}
    >
      <Bookmark className={`h-4 w-4 ${on ? 'fill-coral-500 text-coral-500' : ''}`} aria-hidden="true" />
      {withLabel && (on ? tx.card.saved : tx.card.save)}
    </button>
  );
}

/** Profile photo, or initials on a gradient when there's none (or it fails to load). */
export function Avatar({ profile, className = 'h-9 w-9 text-xs' }: { profile: Pick<Profile, 'avatar_url' | 'full_name' | 'email'> | null; className?: string }) {
  const [broken, setBroken] = useState<string | null>(null);
  const url = profile?.avatar_url ?? '';
  const initials = (profile?.full_name || profile?.email || '?')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  if (url && broken !== url) {
    // no-referrer: Google profile pictures refuse requests from other sites' referrers.
    return <img src={url} alt="" referrerPolicy="no-referrer" onError={() => setBroken(url)} className={`shrink-0 rounded-full object-cover ${className}`} />;
  }
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 font-bold text-white ${className}`} aria-hidden="true">
      {initials}
    </span>
  );
}
