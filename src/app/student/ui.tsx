import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Bookmark, CircleAlert, CircleCheck, Clock, GraduationCap, House, Languages, Plane, ShieldPlus, Wallet, X, type LucideIcon } from 'lucide-react';
import { useAppText } from '../text';
import type { Cover, ShortlistStatus } from '../types';
import { formatDate } from '../util';
import type { DeadlineInfo, Fit } from './logic';

export const eur = (n: number) => `${Math.round(n).toLocaleString('en-US').replace(/,/g, ' ')} €`;

/** "~9 500 €" or "from 4 000 €" (a range shows its low end), or "Depends on programme". */
export function useCostText() {
  const { tx } = useAppText();
  return (range: { min: number; max: number } | null) => (!range ? tx.student.unknown : range.min === range.max ? `~${eur(range.min)}` : tx.student.from(eur(range.min)));
}

/**
 * Side panel on large screens, full screen on phones. Built on <dialog>, so focus
 * stays inside, Esc closes it and the page behind can't be scrolled or clicked.
 */
export function Sheet({ open, onClose, title, wide = false, footer, children }: { open: boolean; onClose: () => void; title: ReactNode; wide?: boolean; footer?: ReactNode; children: ReactNode }) {
  const { tx } = useAppText();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // Closing from here (open → false) fires the dialog's close event too; only report closes the user made.
  const openRef = useRef(open);
  openRef.current = open;
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.body.style.overflow = 'hidden';
    }
    if (!open && d.open) d.close();
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={() => openRef.current && onClose()}
      // A click on the dialog itself (not its content) is a click on the backdrop.
      onClick={(e) => e.target === ref.current && onClose()}
      className={`m-0 ml-auto h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-ink/40 ${wide ? 'sm:max-w-4xl' : 'sm:max-w-xl'}`}
    >
      {open && (
        <div className="flex h-full flex-col bg-white sm:rounded-l-[1.75rem]">
          <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-7 sm:py-5">
            <h2 id={titleId} className="min-w-0 text-xl font-extrabold leading-tight sm:text-2xl">
              {title}
            </h2>
            <button type="button" onClick={onClose} aria-label={tx.close} title={tx.close} className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-paper hover:text-ink">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">{children}</div>
          {footer && <footer className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3 sm:px-7 sm:py-4">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}

const COVER_ICONS: Record<Cover, LucideIcon> = { tuition: GraduationCap, stipend: Wallet, housing: House, flights: Plane, insurance: ShieldPlus, language: Languages };

/** What a scholarship pays for, as icon chips. */
export function CoverChips({ covers }: { covers: Cover[] }) {
  const { tx } = useAppText();
  if (covers.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {covers.map((c) => {
        const Icon = COVER_ICONS[c];
        return (
          <li key={c} className="inline-flex items-center gap-1.5 rounded-full bg-paper px-2.5 py-1 text-xs font-semibold text-slate-700">
            <Icon className="h-3.5 w-3.5 text-brand-700" aria-hidden="true" />
            {tx.student.covers[c]}
          </li>
        );
      })}
    </ul>
  );
}

/** Next deadline in words: an exact date, the usual window, or "dates vary". */
export function DeadlineBadge({ info }: { info: DeadlineInfo }) {
  const { tx, lang } = useAppText();
  const month = (m: number) => tx.calendar.months[m - 1];
  let text: string;
  let tone = 'bg-paper text-slate-700';
  if (info.kind === 'exact') {
    text = info.days === 0 ? tx.student.closesToday : `${formatDate(info.date, lang)} · ${tx.daysLeft(info.days)}`;
    tone = info.days <= 14 ? 'bg-coral-50 text-coral-800' : info.days <= 45 ? 'bg-amber-50 text-amber-900' : 'bg-brand-50 text-brand-900';
  } else if (info.kind === 'window') {
    if (info.open) {
      text = tx.student.openUntil(month(info.closesMonth));
      tone = info.days <= 45 ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-800';
    } else if (info.open === false && info.opensMonth) {
      text = tx.student.opensIn(month(info.opensMonth));
    } else {
      text = tx.student.closesIn(month(info.closesMonth));
    }
  } else {
    text = tx.student.datesVary;
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>
      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {text}
    </span>
  );
}

/** "Fits you", or what doesn't fit (level, field, budget, IELTS). Nothing when no preferences are set. */
export function FitBadge({ fit, minIelts = null }: { fit: Fit; minIelts?: number | null }) {
  const { tx } = useAppText();
  if (!fit.checked) return null;
  if (fit.ok) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
        <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
        {tx.student.fitsYou}
      </span>
    );
  }
  return (
    <>
      {fit.misses.map((m) => (
        <span key={m} className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900">
          <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
          {m === 'ielts' ? tx.student.needIelts(minIelts ?? 0) : tx.student.misses[m]}
        </span>
      ))}
    </>
  );
}

/** Bookmark toggle for a scholarship. */
export function SaveToggle({ on, onClick, withLabel = true }: { on: boolean; onClick: () => void; withLabel?: boolean }) {
  const { tx } = useAppText();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={withLabel ? undefined : on ? tx.student.saved : tx.student.save}
      className={`inline-flex min-h-[2.75rem] items-center gap-1.5 rounded-full border px-4 text-sm font-bold transition ${
        on ? 'border-coral-200 bg-coral-50 text-coral-800' : 'border-line bg-white text-ink hover:border-coral-200 hover:text-coral-700'
      }`}
    >
      <Bookmark className={`h-4 w-4 ${on ? 'fill-coral-700 text-coral-700' : ''}`} aria-hidden="true" />
      {withLabel && (on ? tx.student.saved : tx.student.save)}
    </button>
  );
}

const statusTone: Record<ShortlistStatus, string> = {
  planning: 'border-line bg-white text-slate-700',
  applied: 'border-brand-200 bg-brand-50 text-brand-900',
  accepted: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  rejected: 'border-rose-200 bg-rose-50 text-rose-800',
};

export function StatusSelect({ value, onChange, label }: { value: ShortlistStatus; onChange: (s: ShortlistStatus) => void; label: string }) {
  const { tx } = useAppText();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ShortlistStatus)}
      aria-label={label}
      className={`h-10 rounded-full border px-3 text-sm font-semibold ${statusTone[value]}`}
    >
      {(Object.keys(tx.student.statuses) as ShortlistStatus[]).map((s) => (
        <option key={s} value={s}>
          {tx.student.statuses[s]}
        </option>
      ))}
    </select>
  );
}

/** Labelled paragraph in a details panel. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-base font-bold">{title}</h3>
      <div className="mt-1.5 leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}
