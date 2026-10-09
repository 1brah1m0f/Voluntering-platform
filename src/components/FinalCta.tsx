import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n';
import { Reveal } from './Section';

/** Closing call to action: sign up / log in. */
export default function FinalCta() {
  const { t } = useLang();
  const c = t.finalCta;
  return (
    <section className="py-14 sm:py-20">
      <div className="container-x">
        <Reveal variant="scale">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 px-5 py-9 text-center shadow-soft sm:px-12 sm:py-14">
            <div className="bg-dots-light pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
            <div className="animate-blob pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-300/25 blur-3xl" aria-hidden="true" />
            <div className="animate-blob pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl [animation-delay:-6s]" aria-hidden="true" />
            <div className="relative">
              <h2 className="text-balance text-2xl font-extrabold tracking-tight !text-white sm:text-4xl">{c.title}</h2>
              <p className="mt-3 text-brand-100">{c.sub}</p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link to="/register" className="btn-primary group w-full sm:w-auto">
                  {c.primary}
                  <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                <Link to="/app" className="inline-flex w-full items-center justify-center rounded-full border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10 sm:w-auto">
                  {c.secondary}
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
