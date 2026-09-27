import { BookmarkCheck, Heart, Mail } from 'lucide-react';
import { useLang } from '../i18n';
import { Reveal, SectionHeader } from './Section';

const icons = [Heart, Mail, BookmarkCheck];

export default function HowItWorks() {
  const { t } = useLang();
  return (
    <section id="how" aria-labelledby="how-title" className="py-20 sm:py-24">
      <div className="container-x">
        <SectionHeader id="how-title" eyebrow={t.how.eyebrow} title={t.how.title} />
        <div className="relative mt-14">
        <div className="absolute left-[16%] right-[16%] top-8 hidden border-t-2 border-dashed border-brand-200 md:block" aria-hidden="true" />
        <ol className="relative grid gap-10 md:grid-cols-3 md:gap-6">
          {t.how.steps.map((step, i) => {
            const Icon = icons[i];
            return (
              <li key={step.title} className="relative text-center">
                <Reveal delay={i * 120}>
                  <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-700 text-white shadow-soft">
                    <Icon className="h-7 w-7" aria-hidden="true" />
                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-coral-700 text-sm font-bold text-white ring-4 ring-white">{i + 1}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-bold">{step.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs leading-relaxed text-slate-600">{step.text}</p>
                </Reveal>
              </li>
            );
          })}
        </ol>
        </div>
      </div>
    </section>
  );
}
