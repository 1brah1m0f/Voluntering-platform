import { Link } from 'react-router-dom';
import { ArrowUpRight, Code2, MapPin, Trophy, Users } from 'lucide-react';
import { useAppText } from '../text';
import { DeadlineChip } from '../ui';
import { hackathonText } from './text';
import type { Hackathon, HackathonStage } from './types';

export function HackathonCard({ hackathon: h, stage }: { hackathon: Hackathon; stage?: HackathonStage }) {
  const { lang } = useAppText();
  const t = hackathonText[lang];
  return <article className="flex min-w-0 flex-col rounded-2xl border border-line bg-white p-5 transition hover:border-brand-300">
    <div className="flex items-start justify-between gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Code2 className="h-6 w-6" aria-hidden="true" /></div>
      <div className="flex flex-wrap justify-end gap-1.5"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{t[h.format]}</span>{!h.published && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">{t.draft}</span>}</div>
    </div>
    <p className="mt-5 text-xs font-semibold text-brand-700">{h.organizer}</p>
    <h2 className="mt-1 text-lg font-bold leading-snug"><Link className="hover:text-brand-700" to={`/app/hackathons/${h.id}`}>{h.title}</Link></h2>
    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{h.location || t.online}</p>
    <div className="my-4 flex flex-wrap gap-1.5">{h.technologies.slice(0, 4).map(tech => <span key={tech} className="rounded-md border border-line px-2 py-1 text-xs font-medium text-slate-600">{tech}</span>)}</div>
    <div className="mt-auto space-y-2 border-t border-line pt-4 text-sm">
      <p className="flex items-center gap-2 text-slate-600"><Users className="h-4 w-4 text-brand-600" aria-hidden="true" />{h.team_min}–{h.team_max} {t.people}</p>
      {h.prize && <p className="flex items-center gap-2 text-slate-600"><Trophy className="h-4 w-4 text-coral-600" aria-hidden="true" />{h.prize}</p>}
    </div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-2"><DeadlineChip deadline={h.deadline} /><Link to={`/app/hackathons/${h.id}`} className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline">{t.details}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link></div>
    {stage && <p className="mt-3 text-xs font-bold text-brand-700">✓ {t[stage]}</p>}
  </article>;
}
