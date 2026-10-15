import { Link, useSearchParams } from 'react-router-dom';
import { Bookmark, Code2, Plus, Search, Trophy, Users } from 'lucide-react';
import { useAppText } from '../text';
import { ErrorState, Spinner, inputClass } from '../ui';
import { bakuToday, hackathonMatches } from './logic';
import { hackathonText } from './text';
import { useHackathons } from './useHackathons';
import { HackathonCard } from './HackathonCard';

export default function HackathonsPage() {
  const { lang } = useAppText();
  const t = hackathonText[lang];
  const { rows, entries, error, reload } = useHackathons();
  const [params, setParams] = useSearchParams();
  const setFilter = (key: string, value: string) => setParams(old => {
    const next = new URLSearchParams(old);
    if (value) next.set(key, value); else next.delete(key);
    return next;
  }, { replace: true });
  if (error) return <ErrorState onRetry={reload} />;
  if (!rows) return <Spinner />;
  const today = bakuToday();
  const saved = new Set(entries.map(e => e.hackathon_id));
  const filters = { query: params.get('q') ?? '', format: params.get('format') ?? '', level: params.get('level') ?? '', technology: params.get('tech') ?? '', savedOnly: params.get('saved') === '1', includeClosed: params.get('closed') === '1' };
  const filtered = rows.filter(h => hackathonMatches(h, filters, saved, today));
  const technologies = [...new Set(rows.flatMap(h => h.technologies))].sort();
  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-700">{t.preview}</p><h1 className="font-display text-3xl font-extrabold tracking-tight">{t.title}</h1><p className="mt-2 max-w-xl text-sm text-slate-600 sm:text-base">{t.subtitle}</p></div>
      <Link className="btn-primary text-sm" to="/admin/hackathons/new"><Plus className="h-4 w-4" aria-hidden="true" />{t.new}</Link>
    </header>
    <div className="grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-white">
      {[{ Icon: Code2, n: rows.filter(h => h.deadline >= today).length, label: t.open }, { Icon: Bookmark, n: entries.length, label: t.saved }, { Icon: Users, n: entries.filter(e => e.stage === 'forming_team').length, label: t.forming_team }].map(({ Icon, n, label }) => <div key={label} className="p-3 sm:p-5"><Icon className="mb-3 h-5 w-5 text-brand-700" aria-hidden="true" /><p className="font-display text-2xl font-bold">{n}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>)}
    </div>
    <section aria-label={t.search} className="rounded-2xl border border-line bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="relative"><span className="sr-only">{t.search}</span><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" /><input type="search" className={`${inputClass} pl-9`} placeholder={t.search} value={filters.query} onChange={e => setFilter('q', e.target.value)} /></label>
        <select aria-label={t.format} className={inputClass} value={filters.format} onChange={e => setFilter('format', e.target.value)}><option value="">{t.allFormats}</option>{(['online', 'onsite', 'hybrid'] as const).map(f => <option value={f} key={f}>{t[f]}</option>)}</select>
        <select aria-label={t.level} className={inputClass} value={filters.level} onChange={e => setFilter('level', e.target.value)}><option value="">{t.allLevels}</option>{(['beginner', 'experienced'] as const).map(f => <option value={f} key={f}>{t[f]}</option>)}</select>
        <select aria-label={t.technologies} className={inputClass} value={filters.technology} onChange={e => setFilter('tech', e.target.value)}><option value="">{t.allTech}</option>{technologies.map(tech => <option key={tech}>{tech}</option>)}</select>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-600"><label className="flex items-center gap-2"><input type="checkbox" checked={filters.savedOnly} onChange={e => setFilter('saved', e.target.checked ? '1' : '')} />{t.savedOnly}</label><label className="flex items-center gap-2"><input type="checkbox" checked={filters.includeClosed} onChange={e => setFilter('closed', e.target.checked ? '1' : '')} />{t.closed}</label></div>
    </section>
    {rows.length === 0 ? <div className="rounded-2xl border border-dashed border-line p-8 text-center"><Trophy className="mx-auto h-9 w-9 text-brand-600" aria-hidden="true" /><h2 className="mt-4 text-lg font-bold">{t.empty}</h2><p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{t.emptySub}</p><Link className="btn-secondary mt-5 text-sm" to="/admin/hackathons/new">{t.new}</Link></div>
      : filtered.length === 0 ? <div role="status" className="rounded-2xl border border-line p-8 text-center"><p>{t.noResults}</p><button className="btn-secondary mt-4" onClick={() => setParams({})}>{t.reset}</button></div>
      : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(h => <HackathonCard key={h.id} hackathon={h} stage={entries.find(e => e.hackathon_id === h.id)?.stage} />)}</div>}
  </div>;
}

export function HackathonHomeSection() {
  const { lang } = useAppText();
  const t = hackathonText[lang];
  const { rows, error, reload } = useHackathons();
  const open = rows?.filter(h => h.published && h.deadline >= bakuToday()).slice(0, 3) ?? [];
  return <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-bold"><Code2 className="h-5 w-5 text-brand-700" aria-hidden="true" />{t.mixedTitle}</h2><Link className="text-xs font-bold text-brand-700 hover:underline" to="/app/hackathons">{t.title} →</Link></div>
    {error ? <ErrorState onRetry={reload} /> : !rows ? <Spinner /> : !open.length ? <p className="mt-3 text-sm text-slate-500">{t.empty}</p> : <ul className="mt-3 divide-y divide-line">{open.map(h => <li key={h.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><Link to={`/app/hackathons/${h.id}`} className="text-sm font-bold hover:text-brand-700">{h.title}</Link><p className="mt-1 text-xs text-slate-500">{h.technologies.join(' · ')} · {h.team_min}–{h.team_max} {t.people}</p></div><span className="text-xs font-semibold text-brand-700">{t[h.format]}</span></li>)}</ul>}
  </section>;
}
