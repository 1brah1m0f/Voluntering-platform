import type { Profile } from './types';

// Account types select the section of the app; all features are free.
// Legacy helper names remain compatible with existing consumers.
export const hasFeatures = (p: Pick<Profile, 'plan' | 'is_admin'> | null | undefined) => !!p;
export const hasStudent = (p: Pick<Profile, 'plan' | 'account_type' | 'is_admin'> | null | undefined) =>
  !!p && (p.account_type === 'student' || p.is_admin);

/** A student account (not an admin): kept out of the regular app. */
export const isStudentOnly = (p: Pick<Profile, 'account_type' | 'is_admin'> | null | undefined) => !!p && p.account_type === 'student' && !p.is_admin;

/** A regular account (not an admin): kept out of the student section. */
export const isRegularOnly = (p: Pick<Profile, 'account_type' | 'is_admin'> | null | undefined) => !!p && p.account_type !== 'student' && !p.is_admin;

/** Where an account lands after signing in. */
export const homeFor = (p: (Pick<Profile, 'account_type' | 'is_admin'> & Partial<Pick<Profile, 'prefs'>>) | null | undefined) => {
  if (isStudentOnly(p)) return '/student';
  if (p?.is_admin) {
    if (!p.prefs?.discovery_mode) return '/app/discover';
    if (p.prefs.discovery_mode === 'hackathons') return '/app/hackathons';
  }
  return '/app/home';
};
