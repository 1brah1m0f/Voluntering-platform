import { useId } from 'react';

type P = { className?: string };

export const InstagramIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
  </svg>
);

export const TelegramIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M21.94 4.3 18.7 19.6c-.24 1.08-.88 1.35-1.78.84l-4.93-3.63-2.38 2.29c-.26.26-.48.48-.99.48l.35-5.02 9.14-8.26c.4-.35-.09-.55-.61-.2L6.2 13.2l-4.86-1.52c-1.06-.33-1.08-1.06.22-1.57L20.54 2.8c.88-.33 1.65.2 1.4 1.5z" />
  </svg>
);

/** Openly mark: an open "O" with a rising sun in the gap. Gradient ids are per-instance. */
export const Logo = ({ className }: P) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#27a9b0" />
          <stop offset=".55" stopColor="#1b7a85" />
          <stop offset="1" stopColor="#124a53" />
        </linearGradient>
        <linearGradient id={`${id}sun`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffc56b" />
          <stop offset="1" stopColor="#fb5d3b" />
        </linearGradient>
        <linearGradient id={`${id}gl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".14" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={`url(#${id}bg)`} />
      <path d="M0 18a18 18 0 0 1 18-18h28a18 18 0 0 1 18 18v6C44 30 20 30 0 24z" fill={`url(#${id}gl)`} />
      <circle
        cx="32"
        cy="33"
        r="14.5"
        fill="none"
        stroke="#fff"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray="67.11 24.00"
        transform="rotate(-2.6 32 33)"
      />
      <circle cx="41.32" cy="21.89" r="5.2" fill={`url(#${id}sun)`} />
    </svg>
  );
};
