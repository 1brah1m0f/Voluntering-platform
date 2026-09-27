// Brand icons are not part of lucide-react, so they're inlined here.
type P = { className?: string };

export const InstagramIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
  </svg>
);

export const LinkedinIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4V21H3zM9.5 9.75h3.8v1.54h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-4.99c0-1.19-.02-2.72-1.66-2.72-1.66 0-1.91 1.3-1.91 2.63V21h-4z" />
  </svg>
);

export const TelegramIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M21.94 4.3 18.7 19.6c-.24 1.08-.88 1.35-1.78.84l-4.93-3.63-2.38 2.29c-.26.26-.48.48-.99.48l.35-5.02 9.14-8.26c.4-.35-.09-.55-.61-.2L6.2 13.2l-4.86-1.52c-1.06-.33-1.08-1.06.22-1.57L20.54 2.8c.88-.33 1.65.2 1.4 1.5z" />
  </svg>
);

export const FacebookIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M13.5 21v-7.5h2.53l.38-2.94H13.5V8.69c0-.85.24-1.43 1.46-1.43h1.56V4.63a20.9 20.9 0 0 0-2.27-.12c-2.25 0-3.79 1.37-3.79 3.9v2.15H7.92v2.94h2.54V21z" />
  </svg>
);

export const Logo = ({ className }: P) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <rect width="64" height="64" rx="16" fill="#1b626c" />
    <path d="M20 46V18h24v7H28v5h13v7H28v9z" fill="#fff" />
    <circle cx="46" cy="44" r="5" fill="#fb5d3b" />
  </svg>
);
