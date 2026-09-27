import { Mail } from 'lucide-react';
import { BRAND, CONTACT_EMAIL, SOCIAL_LINKS } from '../config';
import { useLang } from '../i18n';
import { FacebookIcon, InstagramIcon, LinkedinIcon, Logo, TelegramIcon } from './Icons';

const socials = [
  { href: SOCIAL_LINKS.instagram, label: 'Instagram', Icon: InstagramIcon },
  { href: SOCIAL_LINKS.linkedin, label: 'LinkedIn', Icon: LinkedinIcon },
  { href: SOCIAL_LINKS.telegram, label: 'Telegram', Icon: TelegramIcon },
  { href: SOCIAL_LINKS.facebook, label: 'Facebook', Icon: FacebookIcon },
];

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="container-x">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <a href="#top" className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
              <Logo className="h-8 w-8" />
              {BRAND}
            </a>
            <p className="mt-3 text-slate-600">{t.footer.tagline}</p>
          </div>
          <div className="flex flex-col gap-8 sm:flex-row sm:gap-16">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">{t.footer.contact}</h2>
              <a href={`mailto:${CONTACT_EMAIL}`} className="mt-3 inline-flex items-center gap-2 text-slate-600 hover:text-brand-700">
                <Mail className="h-4 w-4" aria-hidden="true" />
                {CONTACT_EMAIL}
              </a>
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">{t.footer.follow}</h2>
              <ul className="mt-3 flex gap-2">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-brand-700 hover:text-white"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-slate-100 pt-6 text-sm text-slate-500 md:flex-row md:justify-between">
          <p>
            © {new Date().getFullYear()} {BRAND}. {t.footer.rights}
          </p>
          <p className="max-w-xl md:text-right">{t.footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
