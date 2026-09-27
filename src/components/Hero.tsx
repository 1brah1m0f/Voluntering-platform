import { ArrowRight, ShieldCheck, Users } from 'lucide-react';
import { useLang } from '../i18n';
import DashboardMockup from './DashboardMockup';

export default function Hero({ count }: { count: number | null }) {
  const { t } = useLang();
  const programs = ['Erasmus+', 'SALTO-Youth', 'European Solidarity Corps', 'UN Volunteers'];

  return (
    <section id="top" className="relative overflow-hidden pb-20 pt-10 sm:pt-16 lg:pb-28">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-100 opacity-70 blur-3xl" />
      <div className="pointer-events-none absolute -left-40 top-40 h-80 w-80 rounded-full bg-coral-100 opacity-70 blur-3xl" />

      <div className="container-x relative grid items-center gap-14 lg:grid-cols-2 lg:gap-10">
        <div className="text-center lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-coral-200 bg-coral-50 px-3 py-1 text-xs font-semibold text-coral-800">
            <span className="h-2 w-2 animate-pulse rounded-full bg-coral-500" />
            {t.hero.badge}
          </p>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            {t.hero.title1} <span className="bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">{t.hero.title2}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">{t.hero.subtitle}</p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <a href="#signup" className="btn-primary w-full text-base sm:w-auto">
              {t.hero.cta}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </a>
            <a href="#how" className="btn-secondary w-full sm:w-auto">
              {t.hero.secondary}
            </a>
          </div>

          <div className="mt-6 flex flex-col items-center gap-2 text-sm text-slate-600 sm:flex-row sm:justify-center sm:gap-5 lg:justify-start">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
              <Users className="h-4 w-4 text-brand-600" aria-hidden="true" />
              {count ? t.hero.counter(count) : t.hero.counterFallback}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden="true" />
              {t.hero.trust}
            </span>
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-2 lg:justify-start" aria-label="Programs">
            {programs.map((p) => (
              <li key={p} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                {p}
              </li>
            ))}
          </ul>
        </div>

        <DashboardMockup />
      </div>
    </section>
  );
}
