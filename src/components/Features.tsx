import { BellRing, Bookmark, LayoutDashboard, Mail, SlidersHorizontal } from 'lucide-react';
import { useLang } from '../i18n';
import { Reveal, SectionHeader } from './Section';
import { StatusPill } from './DashboardMockup';
import { tones, type ToneName } from '../lib/tones';

const icons = [SlidersHorizontal, Mail, Bookmark, BellRing, LayoutDashboard];
const cardTones: ToneName[] = ['brand', 'sky', 'violet', 'coral', 'emerald'];

export default function Features() {
  const { t } = useLang();
  return (
    <section id="features" aria-labelledby="features-title" className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-violet-50/60 py-20 sm:py-24">
      <div className="container-x">
        <SectionHeader id="features-title" eyebrow={t.features.eyebrow} title={t.features.title} subtitle={t.features.subtitle} tone="violet" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
          {t.features.items.map((f, i) => {
            const Icon = icons[i];
            const tone = tones[cardTones[i]];
            // 3 cards on the first row, 2 wider cards on the second (lg).
            const span = i < 3 ? 'lg:col-span-2' : 'lg:col-span-3';
            return (
              <Reveal key={f.title} delay={(i % 3) * 120} variant={i < 3 ? 'up' : i === 3 ? 'left' : 'right'} className={`h-full ${span} ${i === 4 ? 'sm:col-span-2' : ''}`}>
                <article className={`group relative h-full overflow-hidden tilt-card rounded-3xl border border-slate-200 bg-white p-7 shadow-card hover:shadow-soft ${tone.border}`}>
                  <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone.bar}`} aria-hidden="true" />
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition group-hover:scale-110 group-hover:-rotate-3 ${tone.icon}`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-xl font-bold">{f.title}</h3>
                  <p className="mt-2 leading-relaxed text-slate-700">{f.text}</p>
                  {i === 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5" aria-hidden="true">
                      {t.features.interests.map((x, j) => (
                        <span key={x} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${j < 2 ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
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
