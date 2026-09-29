import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ClipboardCheck, Crown, ExternalLink, FileText, Globe2, MapPin, PenLine, Wallet, Shapes, Building2, Users } from 'lucide-react';
import { AiTools } from '../AiTools';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { COSTS, INTERESTS, KINDS, STATUSES, STATUS_ORDER, type InterestId } from '../taxonomy';
import { useAppText } from '../text';
import type { Peer, Status } from '../types';
import { Avatar, DeadlineChip, ErrorState, ProgramBadge, SaveButton, Spinner, statusClass } from '../ui';
import { backend } from '../backend';
import { formatDate, formatRange } from '../util';

export default function DetailPage() {
  const { id = '' } = useParams();
  const { tx, lang } = useAppText();
  const { opportunities, saved, setStatus, error, reload } = useData();
  const { profile } = useAuth();
  const premium = profile?.plan === 'premium' || profile?.is_admin === true;
  const [busy, setBusy] = useState(false);
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'letter' || params.get('tab') === 'review' ? (params.get('tab') as 'letter' | 'review') : 'about';
  // Mount the AI tools on first visit and keep them, so drafts survive tab switches.
  const [aiOpened, setAiOpened] = useState(tab !== 'about');
  const openTab = (t: typeof tab) => {
    if (t !== 'about') setAiOpened(true);
    setParams(t === 'about' ? {} : { tab: t }, { replace: true });
  };

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

  const tabs = [
    { id: 'about' as const, label: tx.detail.about, Icon: FileText, ai: false },
    { id: 'letter' as const, label: tx.ai.tabLetter, Icon: PenLine, ai: true },
    { id: 'review' as const, label: tx.ai.tabReview, Icon: ClipboardCheck, ai: true },
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

        <div role="tablist" aria-label={o.title} className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4 sm:px-6">
          {tabs.map(({ id: t, label, Icon, ai }) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => openTab(t)}
              className={`-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition ${
                tab === t ? (ai ? 'border-violet-600 text-violet-700' : 'border-brand-600 text-brand-800') : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
              {ai &&
                (premium ? (
                  <span className="rounded-full bg-violet-100 px-1.5 text-[10px] font-bold uppercase text-violet-700">AI</span>
                ) : (
                  <Crown className="h-3.5 w-3.5 text-amber-500" aria-label="Premium" />
                ))}
            </button>
          ))}
        </div>

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            {aiOpened && (
              <div hidden={tab === 'about'}>
                <AiTools opportunityId={o.id} tool={tab === 'review' ? 'review' : 'letter'} />
              </div>
            )}
            <div hidden={tab !== 'about'}>
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
          </div>

          <aside className="space-y-4">
            <a href={o.url} target="_blank" rel="noopener noreferrer" className="btn-primary w-full !px-4 text-[15px]">
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
            {item?.status === 'accepted' && <AcceptedPeers opportunityId={o.id} sharing={item.share_contact === true} />}
          </aside>
        </div>
      </article>
    </div>
  );
}

/**
 * For users accepted to this opportunity: opt in to share your contact with the
 * others who were accepted, and see theirs (only people who opted in too).
 */
function AcceptedPeers({ opportunityId, sharing }: { opportunityId: string; sharing: boolean }) {
  const { tx } = useAppText();
  const { setShareContact } = useData();
  const [peers, setPeers] = useState<Peer[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!sharing) return setPeers(null);
    let live = true;
    backend
      .acceptedPeers(opportunityId)
      .then((p) => live && setPeers(p))
      .catch((err) => {
        console.error('[peers] load failed', err);
        if (live) setPeers([]);
      });
    return () => {
      live = false;
    };
  }, [opportunityId, sharing]);

  const toggle = async () => {
    setBusy(true);
    try {
      await setShareContact(opportunityId, !sharing);
    } catch (err) {
      console.error('[peers] share toggle failed', err);
      alert(tx.saveError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
      <h2 className="flex items-center gap-2 font-bold text-emerald-900">
        <Users className="h-4 w-4" aria-hidden="true" />
        {tx.peers.title}
      </h2>
      <p className="mt-1 text-sm text-slate-600">{tx.peers.sub}</p>
      <label className="mt-3 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={sharing}
          disabled={busy}
          onChange={toggle}
          className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-600"
        />
        <span className="text-sm font-semibold text-slate-800">{tx.peers.share}</span>
      </label>
      {sharing && peers === null && <p className="mt-3 text-sm text-slate-500">{tx.loading}</p>}
      {sharing && peers?.length === 0 && <p className="mt-3 text-sm text-slate-600">{tx.peers.none}</p>}
      {sharing && peers && peers.length > 0 && (
        <ul className="mt-3 space-y-2">
          {peers.map((p) => (
            <li key={p.email} className="flex items-center gap-3 rounded-xl bg-white p-2.5 ring-1 ring-emerald-100">
              <Avatar profile={p} className="h-9 w-9 text-xs" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{p.full_name || p.email}</p>
                {(p.headline || p.country) && <p className="truncate text-xs text-slate-500">{p.headline || p.country}</p>}
                <a href={`mailto:${p.email}`} className="block truncate text-xs font-semibold text-brand-700 hover:underline">
                  {p.email}
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
