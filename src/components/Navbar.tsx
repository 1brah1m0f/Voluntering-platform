import { useEffect, useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BRAND } from '../config';
import { useLang, type Lang } from '../i18n';
import { useAuth } from '../app/AuthContext';
import { Logo } from './Icons';

export default function Navbar() {
  const { t, lang, setLang } = useLang();
  const { userId, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const signedIn = !loading && !!userId;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '/app', label: t.nav.opportunities },
    { href: '/guides', label: t.nav.guides },
    { href: '/#pricing', label: t.nav.pricing },
    { href: '/#faq', label: t.faq.eyebrow },
  ];

  return (
    <header className={`sticky top-0 z-50 transition ${scrolled || open ? 'border-b border-slate-200/70 bg-white/90 backdrop-blur-md' : 'bg-transparent'}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:shadow">
        {t.nav.skip}
      </a>
      <nav className="container-x flex h-16 items-center justify-between gap-3" aria-label="Main">
        <a href="#top" className="flex shrink-0 items-center gap-2 text-lg font-extrabold text-slate-900">
          <Logo className="h-8 w-8" />
          {BRAND}
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="text-sm font-semibold text-slate-700 transition hover:text-brand-700">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <div role="group" aria-label={t.nav.langLabel} className="hidden rounded-full border border-slate-200 bg-white p-0.5 text-xs font-bold sm:flex">
            {(['az', 'en'] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`rounded-full px-2.5 py-1 uppercase transition ${lang === l ? 'bg-brand-700 text-white' : 'text-slate-600 hover:text-brand-700'}`}
              >
                {l}
              </button>
            ))}
          </div>

          {signedIn ? (
            <Link to="/app" className="btn-primary !px-4 !py-2 text-sm">
              {t.nav.openApp}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-brand-700">
                {t.nav.login}
              </Link>
              <Link to="/register" className="btn-primary hidden !px-5 !py-2 text-sm sm:inline-flex">
                {t.nav.cta}
              </Link>
            </>
          )}

          <button
            type="button"
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={t.nav.menu}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-slate-200 bg-white/95 shadow-soft backdrop-blur md:hidden">
          <ul className="container-x flex flex-col gap-1 py-3">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 font-semibold text-slate-700 hover:bg-brand-50">
                  {l.label}
                </a>
              </li>
            ))}
            <li className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-semibold text-slate-500">{t.nav.langLabel}</span>
              <div role="group" aria-label={t.nav.langLabel} className="flex rounded-full border border-slate-200 bg-white p-0.5 text-xs font-bold">
                {(['az', 'en'] as Lang[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    aria-pressed={lang === l}
                    className={`rounded-full px-3 py-1 uppercase transition ${lang === l ? 'bg-brand-700 text-white' : 'text-slate-600'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </li>
            {!signedIn && (
              <li className="pt-2">
                <Link to="/register" onClick={() => setOpen(false)} className="btn-primary w-full">
                  {t.nav.cta}
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
