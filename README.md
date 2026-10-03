# Openly

**Openly** gathers international and national volunteering opportunities (Erasmus+, SALTO-Youth,
European Solidarity Corps, UN Volunteers, national programs) in one place. This repo holds:

- **Landing page** at `/` (Azerbaijani, with EN toggle) that leads to sign-up and log-in.
- **Web app** at `/app`: sign up / log in, pick interests, browse and filter opportunities, save
  them and track application status (free plan: 3 at a time).
- **Admin panel** at `/admin`: add, edit, publish/hide and delete opportunities.

Stack: React 18 + TypeScript + Vite + Tailwind CSS + React Router, Supabase for auth and data.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the build
```

Without Supabase credentials the app runs on an **in-browser demo backend**
(`src/app/backend/demoBackend.ts`): accounts and data live in `localStorage`, it comes with sample
opportunities, and the first account you register becomes the admin. A yellow banner shows while
demo mode is on.

## Connect the app to Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. SQL Editor → run [`supabase/app.sql`](supabase/app.sql). It creates `profiles`,
   `opportunities` and `saved_opportunities` with row-level security, a sign-up trigger that
   creates the profile, and the 3-item free-plan limit.
3. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   (Project Settings → API). Restart `npm run dev`. Set the same variables on your host.
4. Authentication → URL Configuration: set **Site URL** to `https://www.openlyapply.com` and add
   `https://www.openlyapply.com/**`, `https://openlyapply.com/**` and `http://localhost:5173/**`
   to the redirect URLs (used by the confirmation email link).
5. Register in the app, then make yourself admin in the SQL Editor:
   `update public.profiles set is_admin = true where email = 'you@example.com';`
   Premium is set the same way: `set plan = 'premium'`.

## Premium AI assistant

Premium users get two extra tabs on every opportunity page (`/app/o/<id>?tab=letter|review`):

- **Motivation letter assistant** — the AI first asks 4–6 questions tailored to the opportunity
  and the user's profile, then builds a draft *only* from the answers (placeholders in
  `[brackets]` instead of invented facts); the user rewrites it in their own voice.
- **Application review** — paste a letter or CV and get a 1–10 fit score, strengths, concrete
  issues (quote → problem → suggestion) and what the committee will look for.

Plus rule-based **smart matching** in the list (fit %, "best match" sort, "N new opportunities
for you"), see `src/app/match.ts`.

The AI runs in the Supabase Edge Function `supabase/functions/ai` and calls Google Gemini
(`gemini-3.1-flash-lite` by default, thinking set to minimal: $0.25 / $1.50 per 1M tokens,
roughly $1–2 per 1000 requests; `gemini-2.5-flash-lite` is no longer open to new API users). It checks that the caller is signed in and Premium, and allows 30 requests per user
per day (`ai_usage` table). The API key never reaches the browser. **Until the key is set, the
tabs are visible but disabled with a "coming soon" note.**

Setup:
1. Re-run `supabase/app.sql` (adds `profiles.about`, `ai_usage`, `bump_ai_usage`).
2. Create an API key in Google AI Studio (aistudio.google.com → Get API key; enable billing for
   the paid tier) and set it as a function secret:
   `supabase secrets set GEMINI_API_KEY=...` (or Dashboard → Edge Functions → Secrets).
   Optional: `GEMINI_MODEL` to use another model.
3. Deploy: `supabase functions deploy ai` (or Dashboard → Edge Functions → Deploy a new function
   → name `ai` → paste `supabase/functions/ai/index.ts`).

Type-check locally: `deno check supabase/functions/ai/index.ts`.

## Student plan (7 ₼)

A third plan above Premium: everything in Premium plus the student section at `/student` —
scholarships, universities (fields, tuition, application fees, requirements), a 16-step
study-abroad roadmap (progress saved in `profiles.roadmap`) and a planner that matches
universities to the user's level, field, IELTS score and budget, with a shortlist that adds up
application fees and first-year costs.

The catalogue lives only in the database (`scholarships`, `universities`), readable by
Student-plan users and admins through RLS (`is_student()`); other users see a preview with counts
(`student_catalog_counts()`). Setup: re-run `supabase/app.sql`, then run
`supabase/seed-student.sql` (safe to re-run; rows are matched by name). Switch a user's plan in
Admin → Users. Fees and deadlines are estimates researched in September 2026 — review them each
year.

## Email notifications

`jobs/notify.mjs` runs daily from GitHub Actions (`.github/workflows/notify.yml`, 08:00 Baku):

- **New-opportunities digest** — opportunities published since the user's last digest that match
  their interests, linking to `/app/o/<id>`. Free plan: Mondays; Premium: every day.
- **Deadline reminders** (Premium) — saved (not yet applied) opportunities closing in 7, 3 or 1 days.

Users can switch either off under Profile → Email notifications. Every email sent is recorded in
`email_log`, so re-running the job never sends twice.

Setup: re-run `supabase/app.sql`, then add these repository secrets (Settings → Secrets and
variables → Actions): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`,
`MAIL_FROM` (e.g. `Openly <noreply@openlyapply.com>`). The job uses the Resend API when
`RESEND_API_KEY` is present. SMTP variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`)
remain supported as a fallback. Test with
Actions → Email notifications → Run workflow (dry run is on by default). Locally:
`npm run notify -- --dry-run`. Planning logic tests: `npm run test:jobs`.

Auth email designs (confirm sign-up, reset password) are in `supabase/email-templates/`; paste
them into Supabase → Authentication → Email Templates. To deliver these auth emails through
Resend, configure Supabase → Authentication → SMTP Settings with host `smtp.resend.com`,
port `465` (SSL) or `587` (TLS), username `resend`, password equal to `RESEND_API_KEY`,
and a `MAIL_FROM` address from a verified Resend domain. This is configuration outside the
frontend; never put the Resend key in a `VITE_*` variable.

## Deploy

Any static host works. Vercel/Netlify: build command `npm run build`, output directory `dist`.
`vercel.json` rewrites app routes (`/app`, `/login`, …) to `index.html`; on Netlify add a
`_redirects` file with `/* /index.html 200`.
The canonical URL and `og:url`/`og:image` in `index.html` point to `https://www.openlyapply.com`. Ideally
replace `public/og-image.svg` with a 1200×630 PNG (some social networks don't render SVG previews).

## Customize

- **Brand name, free plan limit:** `src/config.ts`
- **Program logos in the marquee:** `public/logos/` and `src/components/ProgramStrip.tsx`
- **Accent colors for cards/steps:** `src/lib/tones.ts`
  (also update the hard-coded name in `index.html` meta tags and `public/og-image.svg`).
- **All copy (AZ + EN):** `src/i18n.ts`.
- **Colors:** `tailwind.config.js` (`brand` = teal primary, `coral` = CTA accent).

## Structure

```
src/
  main.tsx              routes (landing, /login, /register, /app/*, /admin/*)
  App.tsx               landing page composition
  LangProvider.tsx      site-wide AZ/EN state
  i18n.ts               landing AZ/EN dictionaries
  config.ts             brand, free-plan limit
  components/           landing sections
  lib/                  programs list, Supabase client
  app/
    backend/            Backend interface + Supabase and demo implementations
    pages/              auth, opportunities, detail, tracker, profile, admin
    AppLayout.tsx       app shell + auth/admin route guards
    text.ts             app AZ/EN strings
supabase/app.sql        app tables, RLS, triggers
```
