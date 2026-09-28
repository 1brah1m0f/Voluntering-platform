// Programs/organisations Openly tracks. Used by the landing logo marquee and the app.
export interface Program {
  name: string;
  /** Logo in /public/logos, if we have one. */
  src?: string;
  href: string;
  /** Logo height classes for the landing marquee. */
  h: string;
  /** Glow colour behind the logo when magnified. */
  glow: string;
}

export const PROGRAMS: Program[] = [
  { name: 'Erasmus+', src: '/logos/erasmus-plus.svg', href: 'https://erasmus-plus.ec.europa.eu/', h: 'h-7 sm:h-9', glow: 'rgba(0, 51, 153, 0.35)' },
  { name: 'SALTO-Youth', src: '/logos/salto-youth.png', href: 'https://www.salto-youth.net/', h: 'h-10 sm:h-12', glow: 'rgba(0, 51, 153, 0.3)' },
  { name: 'European Solidarity Corps', src: '/logos/european-solidarity-corps.png', href: 'https://youth.europa.eu/solidarity_en', h: 'h-10 sm:h-12', glow: 'rgba(168, 30, 120, 0.3)' },
  { name: 'UN Volunteers', src: '/logos/un-volunteers.svg', href: 'https://www.unv.org/', h: 'h-6 sm:h-8', glow: 'rgba(0, 158, 219, 0.35)' },
  { name: 'ASAN Könüllüləri', src: '/logos/asan-volunteers.png', href: 'https://www.asanvolunteers.az/', h: 'h-14 sm:h-[4.5rem]', glow: 'rgba(232, 67, 147, 0.3)' },
  { name: 'European Youth Foundation', src: '/logos/european-youth-foundation.svg', href: 'https://www.coe.int/en/web/european-youth-foundation', h: 'h-11 sm:h-14', glow: 'rgba(52, 150, 70, 0.3)' },
  { name: 'Azərbaycan Qızıl Aypara Cəmiyyəti', src: '/logos/azerbaijan-red-crescent.svg', href: 'https://redcrescent.org.az/', h: 'h-12 sm:h-14', glow: 'rgba(220, 38, 38, 0.3)' },
  { name: 'IFRC', src: '/logos/ifrc.svg', href: 'https://www.ifrc.org/', h: 'h-11 sm:h-14', glow: 'rgba(220, 38, 38, 0.3)' },
  { name: 'UNICEF', src: '/logos/unicef.svg', href: 'https://www.unicef.org/', h: 'h-7 sm:h-9', glow: 'rgba(28, 171, 226, 0.35)' },
];

export const OTHER_PROGRAM = 'Digər';

export function programLogo(name: string): string | undefined {
  return PROGRAMS.find((p) => p.name === name)?.src;
}
