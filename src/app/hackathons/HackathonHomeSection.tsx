import { Link } from 'react-router-dom';
import { Code2 } from 'lucide-react';
import { useAppText } from '../text';
import { ErrorState, Spinner } from '../ui';
import { bakuToday } from './logic';
import { hackathonText } from './text';
import { useHackathons } from './useHackathons';

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
