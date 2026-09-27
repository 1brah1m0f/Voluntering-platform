import { BellRing, Bookmark, LayoutDashboard, Mail, SlidersHorizontal } from 'lucide-react';
import { useLang } from '../i18n';
import { Reveal, SectionHeader } from './Section';
import { StatusPill } from './DashboardMockup';

const icons = [SlidersHorizontal, Mail, Bookmark, BellRing, LayoutDashboard];

export default function Features() {
  const { t } = useLang();
  return (
    <section id="features" aria-labelledby="features-title" className="bg-slate-50 py-20 sm:py-24">
      <div className="container-x">
        <SectionHeader id="features-title" eyebrow={t.features.eyebrow} title={t.features.title} subtitle={t.features.subtitle} />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
          {t.features.items.map((f, i) => {
            const Icon = icons[i];
            // 3 cards on the first row, 2 wider cards on the second (lg).
            const span = i < 3 ? 'lg:col-span-2' : 'lg:col-span-3';
            return (
              <Reveal key={f.title} delay={(i % 3) * 100} className={`h-full ${span} ${i === 4 ? 'sm:col-span-2' : ''}`}>
                <article className="group h-full rounded-3xl border border-slate-200 bg-white p-7 shadow-card transition hover:-translate-y-1 hover:shadow-soft">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-xl font-bold">{f.title}</h3>
                  <p className="mt-2 leading-relaxed text-slate-600">{f.text}</p>
                  {i === 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5" aria-hidden="true">
                      {t.features.interests.map((x, j) => (
                        <span key={x} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${j < 2 ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {x}
                        </span>
                      ))}
                    </div>
                  )}
                  {i === 4 && (
                    <div className="mt-4 flex flex-wrap items-center gap-1.5 text-slate-400" aria-hidden="true">
                      <StatusPill status="saved" />→<StatusPill status="applied" />→<StatusPill status="accepted" />/<StatusPill status="rejected" />
                    </div>
                  )}
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
