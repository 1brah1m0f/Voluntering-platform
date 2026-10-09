import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ClipboardCheck, ExternalLink, FileText, Globe2, MapPin, PenLine, Wallet, Shapes, Building2, Users, BookOpen } from 'lucide-react';
import { AiTools } from '../AiTools';
import { GUIDES } from '../../content/guides';
import { programPageByName } from '../../content/programs';
import { ShareCard } from '../ShareTools';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { COSTS, INTERESTS, KINDS, STATUSES, STATUS_ORDER, type InterestId } from '../taxonomy';
import { useAppText } from '../text';
import type { Opportunity, Peer, Status } from '../types';
import { prepItems, tripItems, type PrepItem, type TripItem } from '../checklist';
import { ageFit, ageRange } from '../personal';
import { Avatar, DeadlineChip, ErrorState, ProgramBadge, SaveButton, Spinner, inputClass, statusClass } from '../ui';
import { backend } from '../backend';
import { daysUntil, formatDate, formatRange } from '../util';

export default function DetailPage() {
  const { id = '' } = useParams();
  const { tx, lang } = useAppText();
  const { opportunities, saved, save, setStatus, error, reload } = useData();
  const { userId, profile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'letter' || params.get('tab') === 'review' ? (params.get('tab') as 'letter' | 'review') : 'about';
  // Mount the AI tools on first visit and keep them, so drafts survive tab switches.
  const [aiOpened, setAiOpened] = useState(tab !== 'about');
  const openTab = (t: typeof tab) => {
    if (t !== 'about') setAiOpened(true);
    setParams(t === 'about' ? {} : { tab: t }, { replace: true });
  };

  // "Did you apply?": after the user opens the official page and comes back,
  // offer to mark the opportunity as applied. The flag survives a reload.
  const applyKey = `openly_apply_${id}`;
  const [askApplied, setAskApplied] = useState(false);
  useEffect(() => {
    const check = () => {
      if (document.visibilityState !== 'visible') return;
      try {
        if (sessionStorage.getItem(applyKey)) setAskApplied(true);
      } catch {
        /* storage blocked */
      }
    };
    check();
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => {
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
    };
  }, [applyKey]);
  const closeApplied = () => {
    setAskApplied(false);
    try {
      sessionStorage.removeItem(applyKey);
    } catch {
      /* storage blocked */
    }
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

  const onApplyClick = () => {
    if (!userId || (item && item.status !== 'saved')) return;
    try {
      sessionStorage.setItem(applyKey, '1');
    } catch {
      /* storage blocked */
    }
  };
  const markApplied = async () => {
    closeApplied();
    setBusy(true);
    try {
      if (!item && !(await save(o.id))) return; // free-plan limit dialog is shown
      await setStatus(o.id, 'applied');
    } catch (err) {
      console.error('[status] failed', err);
      alert(tx.saveError);
    } finally {
      setBusy(false);
    }
  };
  const showApplied = askApplied && !!userId && (!item || item.status === 'saved');

  const facts = [
    { Icon: CalendarDays, label: tx.card.deadline, value: formatDate(o.deadline, lang) },
    ...(o.start_date || o.end_date ? [{ Icon: CalendarDays, label: tx.detail.when, value: formatRange(o.start_date, o.end_date, lang) }] : []),
    { Icon: o.is_online ? Globe2 : MapPin, label: tx.detail.where, value: o.is_online ? tx.list.online : [o.city, o.country].filter(Boolean).join(', ') || '—' },
    { Icon: Shapes, label: tx.detail.type, value: KINDS[o.kind][lang] },
    { Icon: Wallet, label: tx.detail.costs, value: COSTS[o.costs][lang] },
    ...(o.organizer && o.organizer !== o.program ? [{ Icon: Building2, label: tx.detail.organizer, value: o.organizer }] : []),
  ];

  const programPage = programPageByName(o.program);
  // The kind-specific guides first, then the general ones (e.g. the motivation letter).
  const guides = [...GUIDES].filter((g) => g.kinds.includes(o.kind)).sort((a, b) => a.kinds.length - b.kinds.length).slice(0, 2);

  const tabs = [
    { id: 'about' as const, label: tx.detail.about, short: tx.detail.about, Icon: FileText, ai: false },
    { id: 'letter' as const, label: tx.ai.tabLetter, short: tx.ai.tabLetterShort, Icon: PenLine, ai: true },
    { id: 'review' as const, label: tx.ai.tabReview, short: tx.ai.tabReviewShort, Icon: ClipboardCheck, ai: true },
  ];
  const applyLink = (className: string) => (
    <a href={o.url} target="_blank" rel="noopener noreferrer" onClick={onApplyClick} className={`btn-primary !px-4 text-[15px] ${className}`}>
      {tx.detail.apply}
      <ExternalLink className="h-4 w-4" aria-hidden="true" />
    </a>
  );

  return (
    <div>
      {back}
      <article className="mt-4 overflow-hidden rounded-[2rem] border border-line bg-white shadow-card">
        <header className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-coral-50 p-5 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <ProgramBadge program={o.program} size="lg" />
            <div className="min-w-0 flex-1">
              {programPage ? (
                <Link to={`/programs/${programPage.slug}`} className="text-sm font-bold text-brand-700 hover:underline">
                  {o.program}
                </Link>
              ) : (
                <p className="text-sm font-bold text-brand-700">{o.program}</p>
              )}
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

        {/* Phones: three equal tabs with short labels, so none is hidden off-screen. */}
        <div role="tablist" aria-label={o.title} className="flex gap-1 border-b border-line px-2 sm:px-6">
          {tabs.map(({ id: t, label, short, Icon, ai }) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              aria-label={label}
              onClick={() => openTab(t)}
              className={`-mb-px flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap border-b-2 px-2 py-3 text-sm font-semibold transition sm:flex-none sm:px-3 ${
                tab === t ? (ai ? 'border-violet-600 text-violet-700' : 'border-brand-600 text-brand-800') : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="hidden h-4 w-4 sm:block" aria-hidden="true" />
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{label}</span>
              {ai && <span className="rounded-full bg-violet-100 px-1.5 text-[0.6875rem] font-bold uppercase text-violet-700">AI</span>}
            </button>
          ))}
        </div>

        <div className="grid gap-6 p-4 sm:gap-8 sm:p-8 lg:grid-cols-3">
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
              {o.sending_org && <SendingOrg name={o.sending_org} contact={o.sending_org_contact ?? ''} />}
              {guides.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tx.learn.useful}</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {guides.map((g) => (
                      <Link
                        key={g.slug}
                        to={`/guides/${g.slug}`}
                        className="group flex items-center gap-3 rounded-2xl border border-slate-200 p-3 transition hover:border-brand-200 hover:bg-brand-50/40"
                      >
                        <BookOpen className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                        <span className="text-sm font-semibold leading-snug text-slate-800 group-hover:text-brand-800">{g.text[lang].title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            {/* Phones get this button in the sticky bar below instead. */}
            {applyLink('hidden w-full lg:flex')}
            <p className="text-xs leading-relaxed text-slate-500">{tx.detail.applyHint}</p>
            {userId && <AgeHint o={o} birthYear={profile?.prefs?.birth_year} />}
            {showApplied && (
              <div role="status" className="animate-[row-in_0.3s_ease] rounded-2xl border border-brand-200 bg-brand-50 p-4">
                <p className="font-bold text-brand-900">{tx.applied.question}</p>
                <p className="mt-1 text-sm text-brand-900/80">{tx.applied.text}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={markApplied} className="btn-primary !px-4 !py-2 text-sm">
                    {tx.applied.yes}
                  </button>
                  <button type="button" onClick={closeApplied} className="btn-secondary !px-4 !py-2 text-sm">
                    {tx.applied.no}
                  </button>
                </div>
              </div>
            )}
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
              {item && <PrepChecklist o={o} checklist={item.checklist ?? []} note={item.note ?? ''} trip={item.status === 'accepted'} />}
            </div>
            {item?.status === 'accepted' && <AcceptedPeers opportunityId={o.id} sharing={item.share_contact === true} />}
            <ShareCard o={o} />
          </aside>
        </div>
      </article>
      {/* Phones: the main actions stay in reach above the tab bar instead of sitting below all the facts. */}
      <div className="sticky bottom-20 z-30 mt-4 flex items-center gap-2 rounded-3xl border border-line bg-white/95 p-2.5 shadow-soft backdrop-blur lg:hidden">
        {applyLink('flex-1')}
        <SaveButton id={o.id} className="!px-4 !py-3" />
      </div>
      <SimilarOpportunities current={o} />
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
        <input type="checkbox" checked={sharing} disabled={busy} onChange={toggle} className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-600" />
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

/** The usual age limits for this kind of programme, checked against the profile's year of birth. */
function AgeHint({ o, birthYear }: { o: Opportunity; birthYear?: number }) {
  const { tx } = useAppText();
  const range = ageRange(o);
  if (!range) return null;
  const label = range[1] === null ? tx.age.plus(range[0]) : `${range[0]}–${range[1]}`;
  const fit = ageFit(o, birthYear);
  if (fit === 'ok') return <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">✓ {tx.age.ok(label)}</p>;
  if (fit === 'young' || fit === 'old') return <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">{tx.age[fit](label)}</p>;
  return (
    <Link to="/app/profile" className="block rounded-xl bg-paper px-3 py-2 text-xs font-medium text-slate-600 hover:text-brand-700">
      {tx.age.unknown(label)}
    </Link>
  );
}

/** Youth exchanges: who in Azerbaijan the application goes through, and how to reach them. */
function SendingOrg({ name, contact }: { name: string; contact: string }) {
  const { tx } = useAppText();
  const c = contact.trim();
  const href = c.includes('@')
    ? `mailto:${c}`
    : /^https?:\/\//i.test(c)
      ? c
      : /^www\./i.test(c)
        ? `https://${c}`
        : /^\+?[\d\s()-]{7,}$/.test(c)
          ? `tel:${c.replace(/[\s()-]/g, '')}`
          : null;
  return (
    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
      <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">{tx.detail.sendingOrg}</p>
        <p className="mt-0.5 font-bold text-slate-900">{name}</p>
        {c && (
          <p className="mt-1 text-sm text-slate-600">
            {tx.detail.sendingOrgHint}{' '}
            {href ? (
              <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="break-all font-semibold text-brand-700 hover:underline">
                {c}
              </a>
            ) : (
              <span className="font-semibold text-slate-800">{c}</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Application prep for a tracked opportunity: tick the steps, keep a private note.
 * Once accepted (`trip`), the steps become getting ready for the trip.
 */
function PrepChecklist({ o, checklist, note, trip }: { o: Opportunity; checklist: string[]; note: string; trip: boolean }) {
  const { tx } = useAppText();
  const { updateTracking } = useData();
  const [draft, setDraft] = useState(note);
  const [noteSaved, setNoteSaved] = useState(false);
  const items: (PrepItem | TripItem)[] = trip ? tripItems(o) : prepItems(o);
  const label = (i: PrepItem | TripItem) => (trip ? tx.trip.items[i as TripItem] : tx.prep.items[i as PrepItem]);
  const done = items.filter((i) => checklist.includes(i)).length;

  const toggle = async (i: PrepItem | TripItem) => {
    const next = checklist.includes(i) ? checklist.filter((x) => x !== i) : [...checklist, i];
    try {
      await updateTracking(o.id, { checklist: next });
    } catch (err) {
      console.error('[prep] save failed', err);
      alert(tx.saveError);
    }
  };

  const saveNote = async () => {
    if (draft === note) return;
    try {
      await updateTracking(o.id, { note: draft.trim() });
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    } catch (err) {
      console.error('[prep] note save failed', err);
      alert(tx.saveError);
    }
  };

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{trip ? tx.trip.title : tx.prep.title}</p>
        <span className="text-xs font-bold text-brand-700">
          {done}/{items.length}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all" style={{ width: `${(done / items.length) * 100}%` }} />
      </div>
      <ul className="mt-3 space-y-1.5">
        {items.map((i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input type="checkbox" checked={checklist.includes(i)} onChange={() => toggle(i)} className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600" />
              <span className={checklist.includes(i) ? 'text-slate-500 line-through' : 'text-slate-800'}>{label(i)}</span>
            </label>
          </li>
        ))}
      </ul>
      <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`note-${o.id}`}>
        {tx.prep.note}
      </label>
      <textarea
        id={`note-${o.id}`}
        rows={3}
        maxLength={1000}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={saveNote}
        placeholder={tx.prep.notePh}
        className={`${inputClass} mt-1.5 resize-y !py-2 text-sm`}
      />
      {noteSaved && (
        <p role="status" className="mt-1 text-xs font-medium text-emerald-700">
          {tx.prep.noteSaved}
        </p>
      )}
    </div>
  );
}

/** Up to three other open opportunities on the same topics (or of the same kind / programme). */
function SimilarOpportunities({ current }: { current: Opportunity }) {
  const { tx } = useAppText();
  const { opportunities } = useData();
  const similar = (opportunities ?? [])
    .filter((o) => o.id !== current.id && o.published && daysUntil(o.deadline) >= 0)
    .map((o) => ({
      o,
      score: 2 * o.interests.filter((i) => current.interests.includes(i)).length + (o.kind === current.kind ? 1 : 0) + (o.program === current.program ? 1 : 0),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.o.deadline.localeCompare(b.o.deadline))
    .slice(0, 3);
  if (!similar.length) return null;

  return (
    <section aria-labelledby="similar-title" className="mt-8">
      <h2 id="similar-title" className="text-lg font-extrabold">
        {tx.similar.title}
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {similar.map(({ o }) => (
          <Link
            key={o.id}
            to={`/o/${o.id}`}
            className="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card"
          >
            <p className="text-xs font-bold text-brand-700">{o.program}</p>
            <p className="line-clamp-2 font-semibold leading-snug text-slate-900 group-hover:text-brand-800">{o.title}</p>
            <div className="mt-auto pt-1">
              <DeadlineChip deadline={o.deadline} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
