#!/usr/bin/env node
// Daily notification job: new-opportunity digests (free: weekly on Monday,
// Premium: daily) and Premium deadline reminders (7/3/1 days before).
//
// Runs from GitHub Actions (.github/workflows/notify.yml) or locally:
//   npm run notify -- --dry-run                 # show what would be sent, send nothing
//   npm run notify -- --only=you@example.com    # send only to one account
//   npm run notify -- --force-weekly            # treat today as the free-digest day
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SMTP_HOST, SMTP_PORT,
//      SMTP_USER, SMTP_PASS, MAIL_FROM, SITE_URL

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { digestEmail, reminderEmail } from './emails.mjs';
import { logKey, planNotifications } from './plan.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const forceWeekly = args.includes('--force-weekly');
const only = args.find((a) => a.startsWith('--only='))?.slice('--only='.length) || null;

const env = (name, fallback) => {
  const v = process.env[name]?.trim() || fallback;
  if (!v) {
    console.error(`Missing env var ${name}`);
    process.exit(1);
  }
  return v;
};

const SITE = env('SITE_URL', 'https://www.openlyapply.com').replace(/\/$/, '');
const sb = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function must(promise, what) {
  const { data, error } = await promise;
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

/** user id → email, for accounts that confirmed their address. */
async function confirmedEmails() {
  const map = new Map();
  for (let page = 1; ; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    for (const u of data.users) if (u.email && u.email_confirmed_at) map.set(u.id, u.email);
    if (data.users.length < 1000) return map;
  }
}

/**
 * Records the rows in email_log first ("claims" them) so a parallel or repeated
 * run can't send the same email twice. Returns the refs this run now owns.
 */
async function claim(userId, kind, refs) {
  const rows = refs.map((ref) => ({ user_id: userId, kind, ref }));
  const data = await must(sb.from('email_log').upsert(rows, { onConflict: 'user_id,kind,ref', ignoreDuplicates: true }).select('ref'), 'claim');
  return new Set(data.map((r) => r.ref));
}

async function unclaim(userId, kind, refs) {
  await sb.from('email_log').delete().eq('user_id', userId).eq('kind', kind).in('ref', refs);
}

async function main() {
  const now = new Date();
  const [emails, profiles, opportunities, saved, log] = await Promise.all([
    confirmedEmails(),
    must(sb.from('profiles').select('id, full_name, interests, plan, digest_opt_out, reminders_opt_out, last_digest_at'), 'profiles'),
    must(sb.from('opportunities').select('*').eq('published', true), 'opportunities'),
    must(sb.from('saved_opportunities').select('user_id, opportunity_id, status'), 'saved_opportunities'),
    must(sb.from('email_log').select('user_id, kind, ref').gte('sent_at', new Date(now.getTime() - 30 * 864e5).toISOString()), 'email_log'),
  ]);
  const sent = new Set(log.map((r) => logKey(r.user_id, r.kind, r.ref)));

  const plan = planNotifications({ now, profiles, confirmedEmails: emails, opportunities, saved, sent, forceWeekly, only });
  console.log(
    `Baku date ${plan.today}${plan.weeklyDay ? ' (weekly digest day)' : ''} — ${plan.digests.length} digest(s), ${plan.reminders.length} reminder email(s)${dryRun ? ' [dry run]' : ''}`,
  );

  if (dryRun) {
    for (const d of plan.digests) console.log(`  digest   → ${d.email} (${d.premium ? 'premium' : 'free'}): ${d.items.map((o) => o.title).join(' | ')}`);
    for (const r of plan.reminders) console.log(`  reminder → ${r.email}: ${r.items.map(({ opportunity, days }) => `${opportunity.title} (${days}d)`).join(' | ')}`);
    return;
  }

  const port = Number(env('SMTP_PORT', '587'));
  const mailer = nodemailer.createTransport({
    host: env('SMTP_HOST'),
    port,
    secure: port === 465,
    auth: { user: env('SMTP_USER'), pass: env('SMTP_PASS') },
  });
  const from = env('MAIL_FROM', 'Openly <noreply@openlyapply.com>');
  const headers = { 'List-Unsubscribe': `<${SITE}/app/profile?tab=settings>` };
  let ok = 0;
  let failed = 0;

  for (const d of plan.digests) {
    const owned = await claim(d.userId, 'digest', [d.ref]);
    if (!owned.size) continue; // another run already sent it
    try {
      const mail = digestEmail({ ...d, today: plan.today, site: SITE });
      await mailer.sendMail({ from, to: d.email, subject: mail.subject, html: mail.html, text: mail.text, headers });
      await must(sb.from('profiles').update({ last_digest_at: now.toISOString() }).eq('id', d.userId).select('id'), 'last_digest_at');
      ok++;
    } catch (err) {
      failed++;
      console.error(`digest to ${d.email} failed:`, err.message);
      await unclaim(d.userId, 'digest', [d.ref]);
    }
  }

  for (const r of plan.reminders) {
    const owned = await claim(r.userId, 'reminder', r.refs);
    const items = r.items.filter(({ opportunity, days }) => owned.has(`${opportunity.id}:${days}`));
    if (!items.length) continue;
    try {
      const mail = reminderEmail({ name: r.name, items, site: SITE });
      await mailer.sendMail({ from, to: r.email, subject: mail.subject, html: mail.html, text: mail.text, headers });
      ok++;
    } catch (err) {
      failed++;
      console.error(`reminder to ${r.email} failed:`, err.message);
      await unclaim(r.userId, 'reminder', [...owned]);
    }
  }

  console.log(`Sent ${ok}, failed ${failed}.`);
  if (failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
