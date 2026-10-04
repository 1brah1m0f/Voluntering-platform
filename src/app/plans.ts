import type { Plan, Profile } from './types';

// Two account types, fixed at sign-up:
// - regular: the volunteering app, plans basic (free) and premium (3 ₼);
// - student: the student section only, locked until the student plan (7 ₼).
// Admins see both parts of the app.

/** The paid plan itself, without the admin override. */
export const isPaidPlan = (plan: Plan | undefined) => plan === 'premium' || plan === 'student';

/** Premium features: paid plans and admins. */
export const hasPremium = (p: Pick<Profile, 'plan' | 'is_admin'> | null | undefined) => !!p && (isPaidPlan(p.plan) || p.is_admin);

/** The student section's content: student accounts on the student plan, and admins. */
export const hasStudent = (p: Pick<Profile, 'plan' | 'account_type' | 'is_admin'> | null | undefined) =>
  !!p && ((p.account_type === 'student' && p.plan === 'student') || p.is_admin);

/** A student account (not an admin): kept out of the regular app. */
export const isStudentOnly = (p: Pick<Profile, 'account_type' | 'is_admin'> | null | undefined) => !!p && p.account_type === 'student' && !p.is_admin;

/** A regular account (not an admin): kept out of the student section. */
export const isRegularOnly = (p: Pick<Profile, 'account_type' | 'is_admin'> | null | undefined) => !!p && p.account_type !== 'student' && !p.is_admin;

/** Where an account lands after signing in. */
export const homeFor = (p: Pick<Profile, 'account_type' | 'is_admin'> | null | undefined) => (isStudentOnly(p) ? '/student' : '/app/home');
