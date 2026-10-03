import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Globe2, MapPin } from 'lucide-react';
import { useLang } from '../i18n';
import { backend } from '../app/backend';
import type { Opportunity } from '../app/types';
import { DeadlineChip, ProgramBadge } from '../app/ui';
import { daysUntil } from '../app/util';
import { Reveal, SectionHeader } from './Section';

const WEEK = 7 * 86_400_000;

/** Real, current opportunities on the landing page (public; links to /o/:id). */
export default function LiveOpportunities() {
  const { t } = useLang();
  const [open, setOpen] = useState<Opportunity[] | null>(null);

  useEffect(() => {
    backend.listOpportunities().then(
      (list) => setOpen(list.filter((o) => o.published && daysUntil(o.deadline) >= 0)),
      (err) => {
        console.error('[landing] opportunities failed', err);
        setOpen([]);
      },
    );
  }, []);

  if (!open || open.length === 0) return null; // nothing to show yet: skip the section

  const fresh = open.filter((o) => Date.now() - new Date(o.created_at).getTime() < WEEK);
  // Newest first, so the section changes as opportunities are added.
  const shown = [...open].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 4);

  return (
    <section id="live" aria-labelledby="live-title" className="bg-gradient-to-b from-white via-brand-50/40 to-white py-20 sm:py-24">
      <div className="container-x">
        <SectionHeader id="live-title" eyebrow={t.live.eyebrow} title={fresh.length ? t.live.titleNew(fresh.length) : t.live.titleOpen(open.length)} subtitle={t.live.subtitle} tone="coral" />
        <Reveal className="mt-12 grid gap-4 sm:grid-cols-2">
          {shown.map((o) => (
            <Link
              key={o.id}
              to={`/o/${o.id}`}
              className="group flex gap-4 rounded-3xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card sm:p-6"
            >
              <ProgramBadge program={o.program} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-brand-700">{o.program}</p>
                <h3 className="mt-0.5 font-bold leading-snug text-slate-900 group-hover:text-brand-800">{o.title}</h3>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-600">
                  {o.is_online ? <Globe2 className="h-4 w-4 shrink-0" aria-hidden="true" /> : <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />}
                  {o.is_online ? t.live.online : [o.city, o.country].filter(Boolean).join(', ')}
                </p>
                <div className="mt-3">
                  <DeadlineChip deadline={o.deadline} />
                </div>
              </div>
            </Link>
          ))}
        </Reveal>
        <div className="mt-8 text-center">
          <Link to="/app" className="btn-primary">
            {t.live.all}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
