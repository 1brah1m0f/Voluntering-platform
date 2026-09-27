import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLang } from '../i18n';

const R = 22;
const CIRC = 2 * Math.PI * R;

/** Floating "back to top" button; its ring fills as the page is scrolled. */
export default function BackToTop() {
  const { t } = useLang();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
      setVisible(window.scrollY > window.innerHeight * 0.8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label={t.backToTop}
      title={t.backToTop}
      tabIndex={visible ? 0 : -1}
      className={`group fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-soft transition duration-300 hover:-translate-y-1 sm:bottom-8 sm:right-8 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <svg viewBox="0 0 52 52" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="btt-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1f98a1" />
            <stop offset="55%" stopColor="#fb5d3b" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle cx="26" cy="26" r={R} fill="none" stroke="#e2e8f0" strokeWidth="3" />
        <circle
          cx="26"
          cy="26"
          r={R}
          fill="none"
          stroke="url(#btt-grad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - progress)}
        />
      </svg>
      <ArrowUp className="relative h-5 w-5 text-brand-700 transition group-hover:-translate-y-0.5" aria-hidden="true" />
    </button>
  );
}
