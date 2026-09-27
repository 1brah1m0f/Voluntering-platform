import { BRAND } from '../config';
import { useLang } from '../i18n';
import { Logo } from './Icons';

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="container-x">
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <div className="max-w-sm">
            <a href="#top" className="inline-flex items-center gap-2 text-lg font-extrabold text-slate-900">
              <Logo className="h-8 w-8" />
              {BRAND}
            </a>
            <p className="mt-3 text-slate-700">{t.footer.tagline}</p>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-slate-100 pt-6 text-sm text-slate-600 text-center md:flex-row md:justify-between md:text-left">
          <p>
            © {new Date().getFullYear()} {BRAND}. {t.footer.rights}
          </p>
          <p className="max-w-xl md:text-right">{t.footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
