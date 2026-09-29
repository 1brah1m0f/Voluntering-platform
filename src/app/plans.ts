import type { Plan, Profile } from './types';

// Plans: basic (free) < premium (3 ₼) < student (7 ₼). Student includes every
// Premium feature plus the student section (scholarships, universities, roadmap).

/** The paid plan itself, without the admin override. */
export const isPaidPlan = (plan: Plan | undefined) => plan === 'premium' || plan === 'student';

/** Premium features: paid plans and admins. */
export const hasPremium = (p: Pick<Profile, 'plan' | 'is_admin'> | null | undefined) => !!p && (isPaidPlan(p.plan) || p.is_admin);

/** The student section: student plan and admins. */
export const hasStudent = (p: Pick<Profile, 'plan' | 'is_admin'> | null | undefined) => !!p && (p.plan === 'student' || p.is_admin);
