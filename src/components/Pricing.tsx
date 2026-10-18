import { Check } from 'lucide-react';
import { useLang } from '../i18n';
import { Reveal, SectionHeader } from './Section';
import { Link } from 'react-router-dom';

export default function Pricing() {
  const { t } = useLang();
  const p = t.pricing;
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="relative overflow-hidden bg-linear-to-b from-white via-sky-50/60 to-white py-14 sm:py-20 lg:py-24">
      <div className="container-x">
        <SectionHeader id="pricing-title" eyebrow={p.eyebrow} title={p.title} subtitle={p.subtitle} tone="sky" />
        <div className="mx-auto mt-8 grid max-w-2xl gap-6 sm:mt-12">
          <Reveal className="h-full" variant="left">
            <article className="flex h-full flex-col tilt-card rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8 hover:shadow-soft">
              <h3 className="text-xl font-bold">{p.free.name}</h3>
              <p className="mt-1 text-slate-700">{p.free.desc}</p>
              <p className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-slate-900">{p.free.price}</span>
                <span className="text-slate-500">{p.perMonth}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {p.free.features.map((f) => (
                  <li key={f} className="flex gap-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="btn-secondary mt-8 w-full">
                {p.cta}
              </Link>
            </article>
          </Reveal>


        </div>
      </div>
    </section>
  );
}
