import type { Profile } from './types';

export type CompletenessKey = 'photo' | 'interests' | 'country' | 'headline' | 'about';

/** How complete a profile is, and what's missing (dashboard and profile page). */
export function completeness(p: Profile) {
  const checks: [CompletenessKey, boolean][] = [
    ['photo', !!p.avatar_url],
    ['interests', p.interests.length > 0],
    ['country', !!p.country],
    ['headline', !!p.headline?.trim()],
    ['about', !!p.about?.trim()],
  ];
  const missing = checks.filter(([, ok]) => !ok).map(([k]) => k);
  return { percent: Math.round(((checks.length - missing.length) / checks.length) * 100), missing };
}
