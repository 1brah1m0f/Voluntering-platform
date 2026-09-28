# Openly

**Openly** gathers international and national volunteering opportunities (Erasmus+, SALTO-Youth,
European Solidarity Corps, UN Volunteers, national programs) in one place. This repo holds:

- **Landing page** at `/` (Azerbaijani, with EN toggle) with a waitlist form that posts to a Google Form.
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

## Email notifications

`jobs/notify.mjs` runs daily from GitHub Actions (`.github/workflows/notify.yml`, 08:00 Baku):

- **New-opportunities digest** — opportunities published since the user's last digest that match
  their interests, linking to `/app/o/<id>`. Free plan: Mondays; Premium: every day.
- **Deadline reminders** (Premium) — saved (not yet applied) opportunities closing in 7, 3 or 1 days.

Users can switch either off under Profile → Email notifications. Every email sent is recorded in
`email_log`, so re-running the job never sends twice.

Setup: re-run `supabase/app.sql`, then add these repository secrets (Settings → Secrets and
variables → Actions): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_HOST`, `SMTP_PORT`,
`SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` (e.g. `Openly <noreply@openlyapply.com>`). Test with
Actions → Email notifications → Run workflow (dry run is on by default). Locally:
`npm run notify -- --dry-run`. Planning logic tests: `npm run test:jobs`.

Auth email designs (confirm sign-up, reset password) are in `supabase/email-templates/`; paste
them into Supabase → Authentication → Email Templates.

## Waitlist (landing page)

The landing form posts to the Google Form configured in `src/config.ts` (`GOOGLE_FORM`).
Set it to `null` to use Supabase instead (see below) or the local mock.

## Waitlist in Supabase (optional)

1. Create a project at [supabase.com](https://supabase.com).
2. SQL Editor → run [`supabase/schema.sql`](supabase/schema.sql). It creates the `waitlist` table,
   and an insert-only RLS policy for anonymous visitors.
3. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   (Project Settings → API). Set the same variables in your hosting provider.

Stored fields: `name` (full name, required), `email` (unique, case-insensitive), `plan`
(`basic`/`premium`), `lang`, `user_agent`. If you created the table with an older version of the
schema, re-run the file — it adds the `plan` column.
Duplicate emails are shown to the user as "already on the list". Example analysis queries are at
the bottom of the schema file.

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
  config.ts             brand, free-plan limit, Google Form
  components/           landing sections
  lib/                  programs list, Supabase client, waitlist
  app/
    backend/            Backend interface + Supabase and demo implementations
    pages/              auth, opportunities, detail, tracker, profile, admin
    AppLayout.tsx       app shell + auth/admin route guards
    text.ts             app AZ/EN strings
supabase/app.sql        app tables, RLS, triggers
supabase/schema.sql     optional waitlist table
```
