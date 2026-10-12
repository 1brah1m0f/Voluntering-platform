# Security rollout

The repository changes do not change the live database or Edge Functions by themselves.
Production currently uses Supabase project `jmnolviourmydnsokmkc`; verify the intended
project before applying SQL or deploying. The connected Supabase account exposed a
different project during the audit.

1. On an existing installation, run
   `supabase/migrations/20261012160713_security_hardening.sql` in the intended project's
   SQL Editor. On a new installation, run the full `supabase/app.sql`, which includes
   the same hardening. The scripts are idempotent.
2. Deploy the entire `supabase/functions/ai/` directory, including its imported modules:
   `supabase functions deploy ai --project-ref jmnolviourmydnsokmkc`.
   Keep JWT verification enabled; the handler also verifies the signed-in user.
   Apply the SQL and deploy the function in the same maintenance window: the old
   `bump_ai_usage` endpoint is deliberately retired, and the new handler refuses
   generation when the new reservation function is unavailable.
3. Deploy the frontend and Vercel functions from the tested commit. `api/o.js` reads
   `dist/index.html`, included explicitly in its function bundle. Vercel's normal
   build must run before creating the function bundle.
4. Check a public opportunity link, Google/email sign-in, a free AI question/draft,
   and Admin → Users → Acceptance verification in the deployed environment.

AI reservations lock the profile row before checking/incrementing counters. Regular
accounts allow 6 generation requests per minute; admins allow 30. Free users have
3 question generations and 1 draft/review per UTC day. Paid users have 30 question
generations and 15 other generations; admins have 100 of each. Question requests
also require a remaining draft/review use. Denied reservations do not increase the
daily counter. An upstream failure consumes an accepted reservation so repeated
failed calls cannot bypass cost limits.

Opportunity reads for the AI run through the caller's RLS client, including the
24-hour early-access restriction. Privileged reads are limited to the caller's
profile, counters, and the student catalogue after entitlement checks.

Acceptance status stays self-reported for personal tracking. It never grants
contact access by itself: both participants need an admin verification and an
explicit per-opportunity opt-in. Admins verify evidence independently of the
self-reported status. Changing status or deleting the tracked row removes approval;
status changes also clear opt-in. Existing acceptances start unverified.

Database tests use PGlite with the real application SQL and minimal Supabase platform
objects. They check roles, quotas, contact consent/approval, and idempotency. They do
not replace testing real multi-connection concurrency or two live user sessions.

Vercel dashboard firewall/deployment settings could not be inspected because the
connector returned 403; no dashboard settings were changed. Vercel WAF rules only
cover Vercel routes, so the Supabase AI endpoint enforces its own limits.
