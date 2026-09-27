import type { ReactNode } from 'react';
import { useReveal } from '../hooks/useReveal';
import { tones, type ToneName } from '../lib/tones';

export function SectionHeader({
  id,
  eyebrow,
  title,
  subtitle,
  light = false,
  tone = 'brand',
}: {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  light?: boolean;
  tone?: ToneName;
}) {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal mx-auto max-w-2xl text-center">
      <span className={light ? 'mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-100' : `eyebrow ${tones[tone].eyebrow}`}>{eyebrow}</span>
      <h2 id={id} className={`section-title ${light ? '!text-white' : ''}`}>
        {title}
      </h2>
      {subtitle && <p className={`section-sub ${light ? '!text-brand-100' : ''}`}>{subtitle}</p>}
    </div>
  );
}

const variants = { up: '', left: 'reveal-left', right: 'reveal-right', scale: 'reveal-scale' } as const;

export function Reveal({
  children,
  className = '',
  delay = 0,
  variant = 'up',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: keyof typeof variants;
}) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal ${variants[variant]} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
