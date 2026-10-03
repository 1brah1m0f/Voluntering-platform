import { Link } from 'react-router-dom';
import { ArrowRight, Globe2, GraduationCap, HeartHandshake, Users } from 'lucide-react';
import { useLang } from '../i18n';
import { tones, type ToneName } from '../lib/tones';
import { Reveal, SectionHeader } from './Section';

const icons = [Users, GraduationCap, HeartHandshake, Globe2];
const cardTones: ToneName[] = ['coral', 'violet', 'emerald', 'sky'];
// Where each card's "Learn more" goes: the matching guide or programme page.
const targets = ['/guides/youth-exchange', '/programs/salto-youth', '/programs/european-solidarity-corps', '/programs/un-volunteers'];

/** "What are these opportunities?": the programme types explained in plain words. */
export default function Explainer() {
  const { t } = useLang();
  const e = t.explain;
  return (
    <section id="explain" aria-labelledby="explain-title" className="py-20 sm:py-24">
      <div className="container-x">
        <SectionHeader id="explain-title" eyebrow={e.eyebrow} title={e.title} subtitle={e.subtitle} tone="brand" />
        <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2">
          {e.items.map((item, i) => {
            const Icon = icons[i];
            return (
              <Reveal key={item.title} delay={(i % 2) * 120} className="h-full">
                <article className="flex h-full gap-4 rounded-3xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card sm:p-6">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tones[cardTones[i]].icon}`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{item.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-slate-700">{item.text}</p>
                    <p className="mt-3 text-sm font-semibold text-slate-500">{item.meta}</p>
                    <Link to={targets[i]} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline">
                      {t.nav.more}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-slate-600">{e.note}</p>
      </div>
    </section>
  );
}
