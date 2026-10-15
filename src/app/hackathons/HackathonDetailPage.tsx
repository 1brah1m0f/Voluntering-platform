import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Bookmark, CalendarDays, Code2, Pencil, Trash2, Trophy, Users } from 'lucide-react';
import { backend } from '../backend';
import { useAppText } from '../text';
import { DeadlineChip, ErrorState, Spinner, inputClass } from '../ui';
import { formatDate } from '../util';
import { bakuToday } from './logic';
import { hackathonText } from './text';
import type { Hackathon, HackathonStage } from './types';

export default function HackathonDetailPage() {
  const { id = '' } = useParams();
  const { lang } = useAppText();
  const t = hackathonText[lang];
  const navigate = useNavigate();
  const [data, setData] = useState<{ id: string; hackathon: Hackathon | null; stage?: HackathonStage } | null>(null);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true; setError(false);
    Promise.all([backend.getHackathon(id), backend.listHackathonEntries()]).then(([hackathon, entries]) => {
      if (active) setData({ id, hackathon, stage: entries.find(e => e.hackathon_id === id)?.stage });
    }, () => { if (active) setError(true); });
    return () => { active = false; };
  }, [id, version]);
  if (error) return <ErrorState onRetry={() => setVersion(v => v + 1)} />;
  if (!data || data.id !== id) return <Spinner />;
  const h = data.hackathon;
  if (!h) return <p role="status">{t.notFound} <Link className="text-brand-700 underline" to="/app/hackathons">{t.back}</Link></p>;
  const closed = h.deadline < bakuToday();
  const setStage = async (stage: HackathonStage | null) => {
    setBusy(true); setActionError(false);
    try { await backend.setHackathonStage(id, stage); setData(old => old ? { ...old, stage: stage ?? undefined } : old); }
    catch { setActionError(true); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!window.confirm(t.confirmDelete)) return;
    setBusy(true); setActionError(false);
    try { await backend.deleteHackathon(id); navigate('/app/hackathons', { replace: true }); }
    catch { setActionError(true); setBusy(false); }
  };
  return <div>
    <Link to="/app/hackathons" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-700"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{t.back}</Link>
    <header className="rounded-2xl border border-line bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-brand-700"><Code2 className="h-4 w-4" aria-hidden="true" />{t[h.format]} · {h.organizer}{!h.published && <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-800">{t.draft}</span>}</div>
      <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight sm:text-4xl">{h.title}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-3"><DeadlineChip deadline={h.deadline} /><span className="text-sm text-slate-500">{h.location || t.online}</span></div>
      <div className="mt-5 flex flex-wrap gap-2"><Link className="btn-secondary text-sm" to={`/admin/hackathons/${id}/edit`}><Pencil className="h-4 w-4" aria-hidden="true" />{t.edit}</Link><button disabled={busy} onClick={() => void remove()} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-4 w-4" aria-hidden="true" />{t.delete}</button></div>
    </header>
    <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-line bg-white p-5"><h2 className="font-bold">{t.description}</h2><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">{h.description}</p></section>
        {h.eligibility && <section className="rounded-2xl border border-line bg-white p-5"><h2 className="font-bold">{t.eligibility}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{h.eligibility}</p></section>}
        <section className="rounded-2xl border border-line bg-white p-5"><h2 className="font-bold">{t.technologies}</h2><div className="mt-3 flex flex-wrap gap-2">{h.technologies.length ? h.technologies.map(tech => <span className="rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700" key={tech}>{tech}</span>) : <span className="text-sm text-slate-500">—</span>}</div>{h.themes.length > 0 && <><h3 className="mt-5 text-sm font-bold">{t.themes}</h3><p className="mt-2 text-sm text-slate-600">{h.themes.join(' · ')}</p></>}</section>
      </div>
      <aside className="space-y-4">
        <div className="rounded-2xl border border-line bg-white p-5"><dl className="space-y-4">
          {[{ Icon: Trophy, label: t.prize, value: h.prize || '—' }, { Icon: Users, label: t.team, value: `${h.team_min}–${h.team_max} ${t.people}` }, { Icon: CalendarDays, label: t.dates, value: `${formatDate(h.start_date, lang)} – ${formatDate(h.end_date, lang)}` }, { Icon: Code2, label: t.level, value: t[h.level] }].map(({ Icon, label, value }) => <div key={label}><dt className="flex items-center gap-2 text-xs text-slate-500"><Icon className="h-4 w-4" aria-hidden="true" />{label}</dt><dd className="mt-1.5 text-sm font-bold">{value}</dd></div>)}
        </dl>{closed ? <p className="mt-5 text-sm font-semibold text-slate-500">{t.ended}</p> : <a href={h.url} target="_blank" rel="noopener noreferrer" className="btn-primary mt-5 w-full text-center text-sm">{t.apply}<ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" /></a>}</div>
        <section className="rounded-2xl border border-brand-200 bg-brand-50 p-5"><h2 className="font-bold">{t.progress}</h2><p className="mt-2 text-xs leading-relaxed text-slate-600">{t.progressSub}</p>
          {data.stage ? <><select aria-label={t.progress} disabled={busy} value={data.stage} className={`${inputClass} mt-4`} onChange={e => void setStage(e.target.value as HackathonStage)}>{(['saved', 'forming_team', 'registered', 'submitted'] as const).map(stage => <option key={stage} value={stage}>{t[stage]}</option>)}</select><button disabled={busy} className="mt-3 text-xs font-semibold text-slate-500 hover:underline" onClick={() => void setStage(null)}>{t.remove}</button></> : <button disabled={busy} className="btn-secondary mt-4 w-full text-sm" onClick={() => void setStage('saved')}><Bookmark className="h-4 w-4" aria-hidden="true" />{t.saveEvent}</button>}
        </section>
        {actionError && <p role="alert" className="text-sm text-rose-700">{t.error}</p>}
      </aside>
    </div>
  </div>;
}
