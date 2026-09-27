// Color accents for cards and steps. Full class strings so Tailwind keeps them.
export interface Tone {
  /** Solid gradient chip (icons, step badges). */
  icon: string;
  /** Pale tint for card backgrounds / hovers. */
  soft: string;
  /** Hover border color. */
  border: string;
  /** Accent text. */
  text: string;
  /** Thin top bar on cards. */
  bar: string;
  /** Eyebrow pill. */
  eyebrow: string;
}

export const tones = {
  brand: {
    icon: 'bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-brand-500/30',
    soft: 'bg-brand-50',
    border: 'hover:border-brand-300',
    text: 'text-brand-700',
    bar: 'from-brand-400 to-brand-600',
    eyebrow: 'bg-brand-100 text-brand-800',
  },
  coral: {
    icon: 'bg-gradient-to-br from-coral-400 to-coral-600 text-white shadow-coral-500/30',
    soft: 'bg-coral-50',
    border: 'hover:border-coral-300',
    text: 'text-coral-700',
    bar: 'from-coral-400 to-coral-600',
    eyebrow: 'bg-coral-100 text-coral-800',
  },
  amber: {
    icon: 'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-amber-500/30',
    soft: 'bg-amber-50',
    border: 'hover:border-amber-300',
    text: 'text-amber-700',
    bar: 'from-amber-300 to-amber-500',
    eyebrow: 'bg-amber-100 text-amber-800',
  },
  violet: {
    icon: 'bg-gradient-to-br from-violet-400 to-violet-600 text-white shadow-violet-500/30',
    soft: 'bg-violet-50',
    border: 'hover:border-violet-300',
    text: 'text-violet-700',
    bar: 'from-violet-400 to-violet-600',
    eyebrow: 'bg-violet-100 text-violet-800',
  },
  emerald: {
    icon: 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-emerald-500/30',
    soft: 'bg-emerald-50',
    border: 'hover:border-emerald-300',
    text: 'text-emerald-700',
    bar: 'from-emerald-400 to-emerald-600',
    eyebrow: 'bg-emerald-100 text-emerald-800',
  },
  sky: {
    icon: 'bg-gradient-to-br from-sky-400 to-sky-600 text-white shadow-sky-500/30',
    soft: 'bg-sky-50',
    border: 'hover:border-sky-300',
    text: 'text-sky-700',
    bar: 'from-sky-400 to-sky-600',
    eyebrow: 'bg-sky-100 text-sky-800',
  },
} satisfies Record<string, Tone>;

export type ToneName = keyof typeof tones;
