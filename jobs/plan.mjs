// Decides who gets which notification email. Pure functions, no I/O, so they
// can be unit-tested (see plan.test.mjs).

/** Openly runs on Baku time (UTC+4, no DST). */
const BAKU_OFFSET_MS = 4 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Free-plan digests go out on this weekday (0 = Sunday … 1 = Monday). */
export const FREE_DIGEST_WEEKDAY = 1;
/** Premium deadline reminders fire when a saved opportunity closes in this many days. */
export const REMINDER_DAYS = [7, 3, 1];
/** At most this many opportunities are listed in one digest. */
export const DIGEST_MAX_ITEMS = 10;

/** YYYY-MM-DD in Baku for a given instant. */
export function bakuDate(now) {
  return new Date(now.getTime() + BAKU_OFFSET_MS).toISOString().slice(0, 10);
}

export function bakuWeekday(now) {
  return new Date(now.getTime() + BAKU_OFFSET_MS).getUTCDay();
}

/** Whole days from `today` (YYYY-MM-DD) to `date` (YYYY-MM-DD). */
export function daysBetween(today, date) {
  const [y1, m1, d1] = today.split('-').map(Number);
  const [y2, m2, d2] = date.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / DAY_MS);
}

export const logKey = (userId, kind, ref) => `${userId}|${kind}|${ref}`;

/**
 * @param {object} input
 * @param {Date} input.now
 * @param {Array} input.profiles       rows from public.profiles
 * @param {Map<string,string>} input.confirmedEmails  user id → email, confirmed accounts only
 * @param {Array} input.opportunities  rows from public.opportunities
 * @param {Array} input.saved          rows from public.saved_opportunities
 * @param {Set<string>} input.sent     logKey()s already in public.email_log
 * @param {boolean} [input.forceWeekly] treat today as the free-digest day
 * @param {string} [input.only]        restrict to this email (testing)
 */
export function planNotifications({ now, profiles, confirmedEmails, opportunities, saved, sent, forceWeekly = false, only = null }) {
  const today = bakuDate(now);
  const weeklyDay = forceWeekly || bakuWeekday(now) === FREE_DIGEST_WEEKDAY;
  const open = opportunities.filter((o) => o.published && daysBetween(today, o.deadline) >= 0);
  const byId = new Map(opportunities.map((o) => [o.id, o]));

  const digests = [];
  const reminders = [];

  for (const p of profiles) {
    const email = confirmedEmails.get(p.id);
    if (!email) continue; // unconfirmed or deleted account
    if (only && email.toLowerCase() !== only.toLowerCase()) continue;
    const premium = p.plan === 'premium';
    const name = p.full_name || '';

    // --- new-opportunities digest -------------------------------------------
    if (!p.digest_opt_out && (premium || weeklyDay) && !sent.has(logKey(p.id, 'digest', today))) {
      const since = p.last_digest_at ? new Date(p.last_digest_at) : new Date(now.getTime() - (premium ? 1 : 7) * DAY_MS);
      const interests = p.interests ?? [];
      const items = open
        .filter((o) => new Date(o.created_at) > since)
        .filter((o) => interests.length === 0 || (o.interests ?? []).some((i) => interests.includes(i)))
        .sort((a, b) => a.deadline.localeCompare(b.deadline));
      if (items.length) {
        digests.push({ userId: p.id, email, name, premium, ref: today, items: items.slice(0, DIGEST_MAX_ITEMS), total: items.length });
      }
    }

    // --- deadline reminders (Premium) ---------------------------------------
    if (premium && !p.reminders_opt_out) {
      const due = saved
        .filter((s) => s.user_id === p.id && s.status === 'saved')
        .map((s) => byId.get(s.opportunity_id))
        .filter((o) => o && o.published)
        .map((o) => ({ opportunity: o, days: daysBetween(today, o.deadline) }))
        .filter(({ opportunity, days }) => REMINDER_DAYS.includes(days) && !sent.has(logKey(p.id, 'reminder', `${opportunity.id}:${days}`)))
        .sort((a, b) => a.days - b.days);
      if (due.length) {
        reminders.push({ userId: p.id, email, name, items: due, refs: due.map(({ opportunity, days }) => `${opportunity.id}:${days}`) });
      }
    }
  }

  return { today, weeklyDay, digests, reminders };
}
