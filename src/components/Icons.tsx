// The logo is inlined so it needs no extra request.
type P = { className?: string };

export const Logo = ({ className }: P) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <rect width="64" height="64" rx="16" fill="#1b626c" />
    <path d="M20 46V18h24v7H28v5h13v7H28v9z" fill="#fff" />
    <circle cx="46" cy="44" r="5" fill="#fb5d3b" />
  </svg>
);
