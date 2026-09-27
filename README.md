# Openly — market-validation landing page

Single-page landing site (Azerbaijani, with EN toggle) for **Openly**, a platform that gathers
international and national volunteering opportunities (Erasmus+, SALTO-Youth, European Solidarity
Corps, UN Volunteers, national programs) into a personalized daily digest with deadline reminders and
application tracking. The goal of this page is to **measure interest and collect waitlist emails**
before building the product.

Stack: React 18 + TypeScript + Vite + Tailwind CSS, Supabase for storage.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the build
```

Without Supabase credentials the form uses a **mock handler** (see `src/lib/waitlist.ts`) that
stores submissions in the browser's `localStorage`, so the page is fully demo-able.

## Connect Supabase

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
Update the canonical URL and `og:url`/`og:image` in `index.html` to your real domain, and ideally
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
  App.tsx               page composition, language state
  i18n.ts               AZ/EN dictionaries + context
  config.ts             brand constants
  lib/waitlist.ts       submitSignup (Google Form, Supabase or mock)
  components/           Navbar, Hero, DashboardMockup, Problem, HowItWorks,
                        Features, AppPreview, Pricing, FAQ, SignupForm, Footer
supabase/schema.sql     table, RLS
```
