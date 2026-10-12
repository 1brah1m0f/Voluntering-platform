# Openly architecture

Openly has a public volunteering app, an authenticated personal workspace, a
separate student workspace, and an admin workspace. React route guards handle
navigation; database policies and server authorization enforce access.

| Layer | Responsibility |
| --- | --- |
| `src/main.tsx` | Browser bootstrap, shared providers, service worker registration |
| `src/routes/AppRoutes.tsx` | Route definitions, lazy page loading, guards and legacy redirects |
| `src/app/pages/`, `src/app/student/` | User interface and feature flows |
| `src/app/AuthContext.tsx`, `DataContext.tsx` | Session/profile state and shared opportunity/tracking state |
| `src/app/backend/types.ts` | Storage/auth contract used by both backends |
| `src/app/backend/supabaseBackend.ts` | Supabase adapter, typed errors and RPC calls |
| `src/app/backend/demoBackend.ts` | Explicit browser-only demo; loaded dynamically |
| `src/lib/backendConfig.ts` | Build/browser configuration checks and production demo opt-in |
| `src/styles/theme.css` | Brand colours, fonts and design tokens |
| `api/` | Thin Vercel HTTP entry points for public SEO metadata and sitemap |
| `server/` | Public RLS data reads, bounded network requests and HTML rendering |
| `supabase/functions/ai/` | Authenticated AI API with independent modules described below |
| `supabase/app.sql` | Complete idempotent database bootstrap, including hardening |
| `supabase/migrations/` | Incremental SQL for existing installations |
| `scraper/` | Collection → normalization → unpublished drafts |
| `jobs/` | Notification planning and email delivery |

AI `index.ts` wires runtime secrets and Supabase clients. `handler.ts` authenticates
and dispatches requests. `validation.ts` and `http.ts` bound/validate inputs,
`usage.ts` reserves database quotas, `prompts.ts` builds model context,
`schema.ts` describes structured outputs, and `provider.ts` owns the Gemini call
and its timeout. The handler accepts dependencies so security behavior can be
tested without a live account or a billable model call.

Pages depend on the backend contract, rather than calling Supabase directly.
The public Vercel endpoints use only a public key. The AI service-role client is
server-only and is never used to bypass the caller's opportunity visibility.
Demo credentials are public fixtures, held separately from the demo implementation;
production cannot silently switch to demo mode when credentials are absent.

The SQL bootstrap contains an incremental hardening section because older projects
were initialized through the SQL Editor. Changes in that section must also be
reflected in the corresponding migration; tests exercise the complete bootstrap
and its idempotency. Move future database upgrades into new CLI-generated migrations.

Checks run on pushes and pull requests: build, security tests, notification and
student logic tests, dependency audit, and Deno type checking. The CI build uses
an explicit demo opt-in and receives no production credentials.

See [security-rollout.md](security-rollout.md) for the database/function rollout
order and the boundaries that still need a live verification.

The Tailwind 4 toolchain targets modern browsers (Safari 16.4+, Chrome 111+, Firefox 128+).
Desktop and mobile Chrome smoke checks cover public routes, redirects, explicit demo
login, and the admin acceptance section with the configured CSP enabled.
