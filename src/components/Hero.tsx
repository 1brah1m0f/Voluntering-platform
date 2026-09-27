import { ArrowRight, PartyPopper, ShieldCheck, Sparkles } from 'lucide-react';
import { useLang } from '../i18n';
import DashboardMockup from './DashboardMockup';
import { Reveal } from './Section';

// Rising particles: fixed pseudo-random layout so renders are stable.
const particles = Array.from({ length: 18 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  return { size: 4 + r(1) * 8, left: r(2) * 100, duration: 9 + r(3) * 10, delay: -r(4) * 18 };
});

export default function Hero() {
  const { t } = useLang();

  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-10 sm:pt-16 lg:pb-24">
      <div className="bg-dots mask-fade-y pointer-events-none absolute inset-0" />
      <div className="orb -right-32 -top-32 h-[28rem] w-[28rem] bg-brand-200/70" data-depth="40" />
      <div className="orb -left-40 top-40 h-96 w-96 bg-coral-200/60" data-depth="-30" />
      <div className="orb bottom-0 left-1/2 h-72 w-72 bg-violet-200/50" data-depth="25" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {particles.map((p, i) => (
          <span
            key={i}
            className="particle"
            style={{ width: p.size, height: p.size, left: `${p.left}%`, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }}
          />
        ))}
      </div>

      <div className="container-x relative grid items-center gap-14 lg:grid-cols-2 lg:gap-10">
        <div className="text-center lg:text-left">
          <Reveal delay={0}>
            <p className="inline-flex items-center gap-2 rounded-full border border-coral-200 bg-coral-50/80 px-3 py-1 text-xs font-semibold text-coral-800 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-coral-500" />
              </span>
              {t.hero.badge}
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              {t.hero.title1} <span className="text-gradient">{t.hero.title2}</span>
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-700 lg:mx-0">{t.hero.subtitle}</p>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <a href="#signup" className="btn-primary group w-full text-base sm:w-auto">
                {t.hero.cta}
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" aria-hidden="true" />
              </a>
              <a href="#features" className="btn-secondary w-full sm:w-auto">
                {t.hero.secondary}
              </a>
            </div>
          </Reveal>

          <Reveal delay={400}>
            <div className="mt-8 flex flex-col items-center gap-3 text-sm text-slate-700 sm:flex-row sm:justify-center sm:gap-5 lg:justify-start">
              <span className="inline-flex max-w-xs items-center gap-1.5 text-left sm:max-w-none">
                <ShieldCheck className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                {t.hero.trust}
              </span>
            </div>
          </Reveal>
        </div>

        <Reveal variant="right" delay={200}>
          <div className="tilt-card relative">
            <DashboardMockup />

            {/* Floating notification cards around the mockup. Decorative. */}
            <div
              className="animate-float absolute -left-2 top-10 hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white/90 px-4 py-3 shadow-soft backdrop-blur sm:flex lg:-left-10"
              aria-hidden="true"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-bold text-slate-900">{t.float.newToday}</span>
                <span className="block text-xs text-slate-500">{t.float.newTodaySub}</span>
              </span>
            </div>
            <div
              className="animate-float-slow absolute -right-2 bottom-24 hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white/90 px-4 py-3 shadow-soft backdrop-blur [animation-delay:-3s] sm:flex lg:-right-6"
              aria-hidden="true"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
                <PartyPopper className="h-4 w-4" />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-bold text-slate-900">{t.float.accepted}</span>
                <span className="block text-xs text-slate-500">{t.float.acceptedSub}</span>
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
