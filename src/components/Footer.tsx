import { Mail } from 'lucide-react';
import { BRAND, CONTACT_EMAIL, SOCIAL_LINKS } from '../config';
import { useLang } from '../i18n';
import { InstagramIcon, Logo, TelegramIcon } from './Icons';

const socials = [
  { href: SOCIAL_LINKS.instagram, label: 'Instagram', Icon: InstagramIcon },
  { href: SOCIAL_LINKS.telegram, label: 'Telegram', Icon: TelegramIcon },
].filter((s) => s.href);

export default function Footer() {
  const { t } = useLang();
  const product = [
    { to: '/app', label: t.nav.opportunities },
    { to: '#how', label: t.nav.how },
    { to: '#pricing', label: t.nav.pricing },
    { to: '#faq', label: t.faq.eyebrow },
  ];
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="container-x">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
          <div className="max-w-sm">
            <a href="#top" className="inline-flex items-center gap-2 text-lg font-extrabold text-slate-900">
              <Logo className="h-8 w-8" />
              {BRAND}
            </a>
            <p className="mt-3 text-slate-700">{t.footer.tagline}</p>
          </div>
          <nav aria-label={t.footer.product}>
            <p className="text-sm font-bold uppercase tracking-wider text-slate-900">{t.footer.product}</p>
            <ul className="mt-3 space-y-2">
              {product.map((l) => (
                <li key={l.to}>
                  <a href={l.to} className="text-slate-600 hover:text-brand-700">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-slate-900">{t.footer.contact}</p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="mt-3 inline-flex items-center gap-2 text-slate-600 hover:text-brand-700">
              <Mail className="h-4 w-4" aria-hidden="true" />
              {CONTACT_EMAIL}
            </a>
            {socials.length > 0 && (
              <div className="mt-4 flex gap-2">
                {socials.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-slate-100 pt-6 text-center text-sm text-slate-600 md:flex-row md:justify-between md:text-left">
          <p>
            © {new Date().getFullYear()} {BRAND}. {t.footer.rights}
          </p>
          <p className="max-w-xl md:text-right">{t.footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
