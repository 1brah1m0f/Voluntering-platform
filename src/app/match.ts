import { ageFit, durationDays } from './personal';
import type { Opportunity, Profile } from './types';

export type MatchReason = 'interests' | 'funded' | 'partlyFunded' | 'online' | 'country' | 'kind' | 'destination';

/**
 * How well an opportunity fits a user's profile, 0–100, with the reasons that
 * contributed (Premium "smart matching"). Rule-based so it's instant and explainable:
 * shared interests weigh most, then costs covered, then being reachable (online
 * or in the user's own country). The preferences from the profile (types,
 * destinations, funded only, duration, age) nudge the score up or down.
 */
export function matchScore(o: Opportunity, p: Pick<Profile, 'interests' | 'country' | 'prefs'>): { score: number; reasons: MatchReason[] } {
  const reasons: MatchReason[] = [];
  const prefs = p.prefs ?? {};
  let score = 0;

  if (p.interests.length && o.interests.length) {
    const shared = o.interests.filter((i) => p.interests.includes(i)).length;
    score += Math.round((50 * shared) / Math.min(o.interests.length, p.interests.length));
    if (shared) reasons.push('interests');
  } else {
    score += 25; // no interests to compare against — neutral
  }

  if (o.costs === 'full') {
    score += 20;
    reasons.push('funded');
  } else if (o.costs === 'partial') {
    score += 10;
    reasons.push('partlyFunded');
  }
  if (prefs.funded_only && o.costs !== 'full') score -= 20;

  if (o.is_online) {
    score += 10;
    reasons.push('online');
  } else if (p.country && o.country === p.country) {
    score += 10;
    reasons.push('country');
  }

  if (prefs.kinds?.includes(o.kind)) {
    score += 12;
    reasons.push('kind');
  }
  if (!o.is_online && prefs.destinations?.includes(o.country)) {
    score += 8;
    reasons.push('destination');
  }

  const days = durationDays(o);
  if (days !== null && prefs.duration && prefs.duration !== 'any' && (days > 25) !== (prefs.duration === 'long')) score -= 10;

  const age = ageFit(o, prefs.birth_year);
  if (age === 'young' || age === 'old') score = Math.min(score, 20);

  return { score: Math.max(0, Math.min(100, score)), reasons };
}

/** Threshold above which an opportunity counts as "for you". */
export const GOOD_MATCH = 60;
