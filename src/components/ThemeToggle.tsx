import { Moon, Sun } from 'lucide-react';
import { useLang } from '../i18n';
import { useTheme } from '../ThemeProvider';

export default function ThemeToggle({ showLabel = false, className = '' }: { showLabel?: boolean; className?: string }) {
  const { lang } = useLang();
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  const label = lang === 'az' ? 'Tünd rejim' : 'Dark mode';
  const action = lang === 'az' ? (dark ? 'İşıqlı rejimə keç' : 'Tünd rejimə keç') : (dark ? 'Switch to light mode' : 'Switch to dark mode');
  const Icon = dark ? Sun : Moon;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={label}
      title={action}
      onClick={toggleTheme}
      className={`theme-toggle inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-line bg-white text-sm font-semibold text-slate-600 transition hover:bg-brand-50 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${showLabel ? 'w-full px-3 py-2' : 'h-9 w-9'} ${className}`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {showLabel && <span>{label}</span>}
    </button>
  );
}
