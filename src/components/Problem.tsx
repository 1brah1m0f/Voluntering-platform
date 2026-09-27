import { CalendarX, Layers, ListChecks } from 'lucide-react';
import { useLang } from '../i18n';
import { Reveal, SectionHeader } from './Section';
import { tones, type ToneName } from '../lib/tones';

const icons = [Layers, CalendarX, ListChecks];
const cardTones: ToneName[] = ['coral', 'amber', 'violet'];

export default function Problem() {
  const { t } = useLang();
  return (
    <section aria-labelledby="problem-title" className="relative overflow-hidden bg-gradient-to-b from-coral-50/70 via-white to-white py-20 sm:py-24">
      <div className="container-x">
        <SectionHeader id="problem-title" eyebrow={t.problem.eyebrow} title={t.problem.title} subtitle={t.problem.subtitle} tone="coral" />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {t.problem.items.map((item, i) => {
            const Icon = icons[i];
            const tone = tones[cardTones[i]];
            return (
              <Reveal key={item.title} delay={i * 120} variant="scale" className="h-full">
                <article className={`group relative h-full overflow-hidden tilt-card rounded-3xl border border-slate-200 bg-white p-7 shadow-card hover:shadow-soft ${tone.border}`}>
                  <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone.bar}`} aria-hidden="true" />
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition group-hover:scale-110 group-hover:rotate-3 ${tone.icon}`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-xl font-bold">{item.title}</h3>
                  <p className="mt-2 leading-relaxed text-slate-700">{item.text}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
