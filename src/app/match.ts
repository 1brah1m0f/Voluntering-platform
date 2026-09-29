import type { Opportunity, Profile } from './types';

export type MatchReason = 'interests' | 'funded' | 'partlyFunded' | 'online' | 'country';

/**
 * How well an opportunity fits a user's profile, 0–100, with the reasons that
 * contributed (Premium "smart matching"). Rule-based so it's instant and explainable:
 * shared interests weigh most, then costs covered, then being reachable (online
 * or in the user's own country).
 */
export function matchScore(o: Opportunity, p: Pick<Profile, 'interests' | 'country'>): { score: number; reasons: MatchReason[] } {
  const reasons: MatchReason[] = [];
  let score = 0;

  if (p.interests.length && o.interests.length) {
    const shared = o.interests.filter((i) => p.interests.includes(i)).length;
    score += Math.round((60 * shared) / Math.min(o.interests.length, p.interests.length));
    if (shared) reasons.push('interests');
  } else {
    score += 30; // no interests to compare against — neutral
  }

  if (o.costs === 'full') {
    score += 25;
    reasons.push('funded');
  } else if (o.costs === 'partial') {
    score += 12;
    reasons.push('partlyFunded');
  }

  if (o.is_online) {
    score += 15;
    reasons.push('online');
  } else if (p.country && o.country === p.country) {
    score += 15;
    reasons.push('country');
  }

  return { score: Math.min(100, score), reasons };
}

/** Threshold above which an opportunity counts as "for you". */
export const GOOD_MATCH = 60;
