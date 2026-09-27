import { BookmarkCheck, Heart, Mail } from 'lucide-react';
import { useLang } from '../i18n';
import { Reveal, SectionHeader } from './Section';
import { tones, type ToneName } from '../lib/tones';

const icons = [Heart, Mail, BookmarkCheck];
const stepTones: ToneName[] = ['coral', 'brand', 'emerald'];

export default function HowItWorks() {
  const { t } = useLang();
  return (
    <section id="how" aria-labelledby="how-title" className="py-20 sm:py-24">
      <div className="container-x">
        <SectionHeader id="how-title" eyebrow={t.how.eyebrow} title={t.how.title} tone="emerald" />
        <div className="relative mt-14">
        <div className="absolute left-[16%] right-[16%] top-8 hidden h-0.5 bg-gradient-to-r from-coral-300 via-brand-300 to-emerald-300 md:block" aria-hidden="true" />
        <ol className="relative grid gap-10 md:grid-cols-3 md:gap-6">
          {t.how.steps.map((step, i) => {
            const Icon = icons[i];
            const tone = tones[stepTones[i]];
            return (
              <li key={step.title} className="relative text-center">
                <Reveal delay={i * 150} variant="scale">
                  <div className={`relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg ring-8 ring-white transition hover:rotate-6 ${tone.icon}`}>
                    <Icon className="h-7 w-7" aria-hidden="true" />
                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white ring-4 ring-white">{i + 1}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-bold">{step.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs leading-relaxed text-slate-700">{step.text}</p>
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
