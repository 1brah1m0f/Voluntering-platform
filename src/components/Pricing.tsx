import { Check, Sparkles } from 'lucide-react';
import { useLang } from '../i18n';
import { Reveal, SectionHeader } from './Section';
import { selectPlan } from './SignupForm';

export default function Pricing() {
  const { t } = useLang();
  const p = t.pricing;
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="relative overflow-hidden bg-gradient-to-b from-white via-sky-50/60 to-white py-20 sm:py-24">
      <div className="container-x">
        <SectionHeader id="pricing-title" eyebrow={p.eyebrow} title={p.title} subtitle={p.subtitle} tone="sky" />
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          <Reveal className="h-full" variant="left">
            <article className="flex h-full flex-col tilt-card rounded-3xl border border-slate-200 bg-white p-8 shadow-card hover:shadow-soft">
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
              <a href="#signup" onClick={() => selectPlan('basic')} className="btn-secondary mt-8 w-full">
                {p.cta}
              </a>
            </article>
          </Reveal>

          <Reveal className="h-full" variant="right" delay={120}>
            <article className="relative isolate flex h-full flex-col rounded-3xl bg-gradient-to-br from-brand-800 to-brand-950 p-8 text-brand-50 tilt-card shadow-soft ring-1 ring-brand-900">
              <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl" aria-hidden="true">
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-coral-500/25 blur-3xl" />
                <div className="bg-dots-light absolute inset-0 opacity-30" />
              </div>
              <span className="absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full bg-coral-700 px-3 py-1 text-xs font-bold text-white shadow">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {p.popular}
              </span>
              <h3 className="text-xl font-bold !text-white">{p.premium.name}</h3>
              <p className="mt-1 text-brand-100">{p.premium.desc}</p>
              <p className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-white">{p.premium.price}</span>
                <span className="text-brand-200">{p.perMonth}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {p.premium.features.map((f) => (
                  <li key={f} className="flex gap-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-coral-300" aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a href="#signup" onClick={() => selectPlan('premium')} className="btn-primary mt-8 w-full">
                {p.cta}
              </a>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
