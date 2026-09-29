import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Crown, ExternalLink, Globe2, MapPin, Wallet, Shapes, Building2, Sparkles } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { COSTS, INTERESTS, KINDS, STATUSES, STATUS_ORDER, type InterestId } from '../taxonomy';
import { useAppText } from '../text';
import type { Status } from '../types';
import { DeadlineChip, ErrorState, ProgramBadge, SaveButton, Spinner, statusClass } from '../ui';
import { formatDate, formatRange } from '../util';

export default function DetailPage() {
  const { id = '' } = useParams();
  const { tx, lang } = useAppText();
  const { opportunities, saved, setStatus, error, reload } = useData();
  const { profile } = useAuth();
  const premium = profile?.plan === 'premium' || profile?.is_admin === true;
  const [busy, setBusy] = useState(false);

  if (error) return <ErrorState onRetry={reload} />;
  if (!opportunities) return <Spinner label={tx.loading} />;
  const o = opportunities.find((x) => x.id === id);

  const back = (
    <Link to="/app" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-brand-700">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {tx.back}
    </Link>
  );

  if (!o) {
    return (
      <div>
        {back}
        <p className="mt-10 rounded-3xl border border-dashed border-slate-300 py-14 text-center text-slate-500">{tx.detail.notFound}</p>
      </div>
    );
  }

  const item = saved.get(o.id);
  const changeStatus = async (s: Status) => {
    setBusy(true);
    try {
      await setStatus(o.id, s);
    } catch (err) {
      console.error('[status] failed', err);
      alert(tx.saveError);
    } finally {
      setBusy(false);
    }
  };

  const facts = [
    { Icon: CalendarDays, label: tx.card.deadline, value: formatDate(o.deadline, lang) },
    ...(o.start_date || o.end_date ? [{ Icon: CalendarDays, label: tx.detail.when, value: formatRange(o.start_date, o.end_date, lang) }] : []),
    { Icon: o.is_online ? Globe2 : MapPin, label: tx.detail.where, value: o.is_online ? tx.list.online : [o.city, o.country].filter(Boolean).join(', ') || '—' },
    { Icon: Shapes, label: tx.detail.type, value: KINDS[o.kind][lang] },
    { Icon: Wallet, label: tx.detail.costs, value: COSTS[o.costs][lang] },
    ...(o.organizer && o.organizer !== o.program ? [{ Icon: Building2, label: tx.detail.organizer, value: o.organizer }] : []),
  ];

  return (
    <div>
      {back}
      <article className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
        <header className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-coral-50 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <ProgramBadge program={o.program} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-brand-700">{o.program}</p>
              <h1 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{o.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <DeadlineChip deadline={o.deadline} />
                {o.interests.map((i) => (
                  <span key={i} className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                    {INTERESTS[i as InterestId]?.[lang] ?? i}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold">{tx.detail.about}</h2>
            <p className="mt-2 whitespace-pre-line leading-7 text-slate-700">{o.description || '—'}</p>
            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              {facts.map(({ Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
                    <dd className="font-semibold text-slate-900">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <aside className="space-y-4">
            <a href={o.url} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
              {tx.detail.apply}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
            <p className="text-xs leading-relaxed text-slate-500">{tx.detail.applyHint}</p>
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-900">{tx.nav.tracker}</span>
                <SaveButton id={o.id} withLabel />
              </div>
              {item && (
                <fieldset className="mt-4" disabled={busy}>
                  <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{tx.detail.status}</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUS_ORDER.map((s) => (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={item.status === s}
                        onClick={() => changeStatus(s)}
                        className={`rounded-xl px-2 py-2 text-xs font-bold transition ${
                          item.status === s ? `${statusClass(s)} ring-2 ring-current` : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {STATUSES[s][lang]}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
            </div>
            <Link
              to={premium ? `/app/o/${o.id}/ai` : '/app/premium'}
              className="group block overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-brand-700 to-brand-900 p-4 text-white shadow-soft transition hover:-translate-y-0.5"
            >
              <p className="flex items-center gap-2 font-bold">
                <Sparkles className="h-4 w-4 text-violet-200" aria-hidden="true" />
                {tx.ai.title}
                {!premium && <Crown className="ml-auto h-4 w-4 text-amber-300" aria-hidden="true" />}
              </p>
              <p className="mt-1 text-sm text-violet-100">{premium ? tx.ai.sub : tx.ai.locked}</p>
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold transition group-hover:bg-white/25">
                {premium ? tx.ai.open : tx.list.seePremium} →
              </span>
            </Link>
          </aside>
        </div>
      </article>
    </div>
  );
}
