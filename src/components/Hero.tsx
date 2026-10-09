import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { useLang } from '../i18n';
import { InstallLink } from './InstallPrompt';
import { Reveal } from './Section';

/** A date `days` from today, as { day, month index }. The passes always show upcoming dates. */
function fromToday(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return { day: d.getDate(), month: d.getMonth() };
}

export default function Hero() {
  const { t } = useLang();

  return (
    <section id="top" className="relative overflow-hidden bg-paper pb-14 pt-8 sm:pb-20 sm:pt-16 lg:pb-24">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-100/70 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-coral-100/60 blur-3xl" aria-hidden="true" />
      <div className="container-x relative grid items-center gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        <div className="text-center lg:text-left">
          <Reveal delay={100}>
            <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[4rem]">
              {t.hero.title1} <span className="text-coral-700">{t.hero.title2}</span>
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-700 sm:text-lg sm:leading-8 lg:mx-0">{t.hero.subtitle}</p>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link to="/app" className="btn-primary group w-full text-base sm:w-auto">
                {t.hero.cta}
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link to="/register" className="btn-secondary w-full sm:w-auto">
                {t.hero.secondary}
              </Link>
            </div>
            <div className="mt-4 flex justify-center lg:justify-start">
              <InstallLink />
            </div>
          </Reveal>
          <Reveal delay={360} className="sm:hidden">
            <div className="mt-7 rounded-3xl border border-line bg-white p-4 text-left shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700">{t.hero.pass.exchange} · Erasmus+</span>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{t.hero.pass.covered}</span>
              </div>
              <div className="mt-4 flex items-center gap-3 font-display text-2xl font-extrabold text-ink">
                {t.hero.pass.from}
                <ArrowRight className="h-5 w-5 text-coral-700" />
                {t.hero.pass.lisbon}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-dashed border-line pt-3 text-sm">
                <span className="text-slate-500">{t.hero.pass.environment}</span>
                <span className="font-bold text-coral-700">{t.hero.pass.daysLeft(3)}</span>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal variant="right" delay={200} className="hidden sm:block">
          <BoardingPasses />
        </Reveal>
      </div>
    </section>
  );
}

/** Two opportunities drawn as boarding passes (Baku → the host city), plus an "accepted" toast. Decorative. */
function BoardingPasses() {
  const { t } = useLang();
  const p = t.hero.pass;
  const m = (i: number) => p.months[i];
  const deadline = fromToday(3);
  const start = fromToday(40);
  const end = fromToday(48);
  const dates = start.month === end.month ? `${start.day}–${end.day} ${m(end.month)}` : `${start.day} ${m(start.month)} – ${end.day} ${m(end.month)}`;
  const label = 'block text-[0.6875rem] font-bold uppercase tracking-widest text-slate-500';

  return (
    <div className="relative mx-auto h-[34rem] max-w-[34rem]" aria-hidden="true">
      {/* The sun and ring from the logo. */}
      <span className="absolute right-2 top-0 h-52 w-52 rounded-full bg-coral-400" />
      <span className="absolute bottom-2 left-4 h-64 w-64 rounded-full border-[26px] border-brand-100" />

      {/* Back pass */}
      <div className="absolute right-0 top-16 flex h-52 w-[27rem] rotate-[5deg] rounded-[1.375rem] bg-white shadow-soft">
        <div className="flex flex-1 flex-col justify-between p-6">
          <span className={label}>{p.training}</span>
          <span className="flex items-center gap-3 font-display text-4xl font-extrabold tracking-tight text-ink">
            {p.from}
            <ArrowRight className="h-6 w-6 text-coral-700" strokeWidth={2.4} />
            {p.berlin}
          </span>
          <span className="text-sm">
            <span className={label}>{p.topic}</span>
            <strong className="text-ink">{p.climate}</strong>
          </span>
        </div>
        <div className="flex w-28 shrink-0 flex-col items-center justify-center border-l-2 border-dashed border-line text-center">
          <span className={label}>{p.applyBy}</span>
          <span className="font-display text-2xl font-extrabold text-ink">
            {fromToday(6).day} {m(fromToday(6).month)}
          </span>
        </div>
      </div>

      {/* Front pass */}
      <div className="absolute left-0 top-60 flex h-56 w-[30rem] -rotate-3 rounded-[1.375rem] bg-white shadow-[0_24px_50px_-20px_rgba(15,58,66,0.45)]">
        {/* Punched notches at both ends of the perforation. */}
        <span className="absolute -top-3 right-[7.25rem] h-6 w-6 rounded-full bg-paper" />
        <span className="absolute -bottom-3 right-[7.25rem] h-6 w-6 rounded-full bg-paper" />
        <div className="flex flex-1 flex-col justify-between p-6">
          <span className={label}>{p.exchange} · Erasmus+</span>
          <span className="flex items-center gap-3 font-display text-[2.5rem] font-extrabold leading-none tracking-tight text-ink">
            {p.from}
            <ArrowRight className="h-7 w-7 text-coral-700" strokeWidth={2.4} />
            {p.lisbon}
          </span>
          <span className="flex gap-6 text-sm">
            <span>
              <span className={label}>{p.dates}</span>
              <strong className="text-ink">{dates}</strong>
            </span>
            <span>
              <span className={label}>{p.topic}</span>
              <strong className="text-ink">{p.environment}</strong>
            </span>
            <span>
              <span className={label}>{p.costs}</span>
              <strong className="text-emerald-700">{p.covered}</strong>
            </span>
          </span>
        </div>
        <div className="flex w-32 shrink-0 flex-col items-center justify-center gap-3 border-l-2 border-dashed border-line px-3 text-center">
          <span>
            <span className={label}>{p.applyBy}</span>
            <span className="block font-display text-3xl font-extrabold leading-tight text-coral-700">
              {deadline.day} {m(deadline.month)}
            </span>
            <span className="block text-xs font-bold text-coral-800">{p.daysLeft(3)}</span>
          </span>
          {/* Barcode */}
          <span className="h-9 w-20 bg-[repeating-linear-gradient(90deg,#0f2a2e_0_2px,transparent_2px_4px,#0f2a2e_4px_7px,transparent_7px_9px,#0f2a2e_9px_10px,transparent_10px_13px)]" />
        </div>
      </div>

      {/* "Accepted" toast */}
      <div className="animate-float-slow absolute bottom-4 right-6 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-soft">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white">
          <Check className="h-5 w-5" strokeWidth={2.6} />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-bold text-ink">{t.float.accepted}</span>
          <span className="block text-xs text-slate-600">{t.float.acceptedSub}</span>
        </span>
      </div>
    </div>
  );
}
