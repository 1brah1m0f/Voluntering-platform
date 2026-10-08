import type { ReactNode } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { BookOpen, CalendarDays, GraduationCap, House, ListChecks, LogOut, Map as MapIcon, Search, Shield, Sparkles, UserRound, type LucideIcon } from 'lucide-react';
import { BRAND } from '../config';
import { Logo } from '../components/Icons';
import { useLang } from '../i18n';
import { backend } from './backend';
import { useAuth } from './AuthContext';
import { DataProvider } from './DataContext';
import { useAppText } from './text';
import { Avatar, Spinner } from './ui';
import { hasPremium, homeFor, isPaidPlan, isRegularOnly, isStudentOnly } from './plans';

/** The landing page is for guests; signed-in users go straight to their own home. */
export function LandingRoute({ children }: { children: ReactNode }) {
  const { loading, userId, profile } = useAuth();
  if (loading) return <Spinner />;
  if (userId) return <Navigate to={homeFor(profile)} replace />;
  return <>{children}</>;
}

/** Renders children only for signed-in users; otherwise redirects to /login. */
export function RequireAuth() {
  const { loading, userId } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  // Keep the query/hash so an OAuth error from Supabase reaches the login page.
  if (!userId) return <Navigate to={`/login${location.search}${location.hash}`} replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { profile } = useAuth();
  if (!profile) return <Spinner />;
  if (!profile.is_admin) return <Navigate to="/app" replace />;
  return <Outlet />;
}

/** The student section: student accounts (and admins). Regular accounts go back to their dashboard. */
export function RequireStudentAuth() {
  const { loading, userId, profile } = useAuth();
  if (loading) return <Spinner />;
  if (!userId) return <Navigate to="/login?as=student" replace />;
  if (isRegularOnly(profile)) return <Navigate to="/app/home" replace />;
  return <Outlet />;
}

/** Shell of the student section (/student, /student/profile): a top bar with the account menu. */
export function StudentLayout() {
  const { tx } = useAppText();
  const { lang, setLang } = useLang();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const logout = async () => {
    await backend.signOut();
    navigate('/login?as=student', { replace: true });
  };
  return (
    <div className="app-surface min-h-screen">
      {backend.mode === 'demo' && <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">{tx.demoBanner}</p>}
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-12">
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-sm sm:px-5">
          <Link to="/student" className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-ink">
            <Logo className="h-7 w-7" />
            {BRAND} <span className="hidden text-sm font-bold text-brand-700 sm:inline">Student</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Admins also use the regular app; students only have this section. */}
            {profile?.is_admin && (
              <Link to="/app/home" className="hidden rounded-full px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-paper hover:text-ink sm:inline-flex">
                {tx.nav.admin}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setLang(lang === 'az' ? 'en' : 'az')}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-bold uppercase text-slate-700"
            >
              {lang === 'az' ? 'en' : 'az'}
            </button>
            <NavLink
              to="/student/profile"
              title={tx.nav.profile}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-full py-1 pl-1 pr-1 text-sm font-bold transition sm:pr-3 ${isActive ? 'bg-brand-50 text-brand-900 ring-1 ring-brand-100' : 'text-slate-600 hover:bg-paper hover:text-ink'}`
              }
            >
              <Avatar profile={profile} className="h-8 w-8 text-[11px]" />
              <span className="hidden sm:inline">{tx.nav.profile}</span>
            </NavLink>
            <button
              type="button"
              onClick={logout}
              title={tx.nav.logout}
              aria-label={tx.nav.logout}
              className="inline-flex items-center gap-2 rounded-full p-2 text-sm font-bold text-slate-600 transition hover:bg-rose-50 hover:text-rose-700 sm:px-3"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{tx.nav.logout}</span>
            </button>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}

/** /app/o/:id moved to /o/:id; keeps links in already-sent emails working. */
export function OldDetailRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={`/o/${id}`} replace />;
}

/** App shell. Guests (on the public list and opportunity pages) get sign-in buttons instead of the account menu. */
export default function AppLayout() {
  const { tx } = useAppText();
  const { lang, setLang } = useLang();
  const { loading, userId, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const guest = !userId;
  // After signing in, come back to the page the guest was looking at.
  const back = { from: location.pathname + location.search };

  type NavItem = { to: string; end: boolean; label: string; Icon: LucideIcon; also?: string; badge?: string; state?: any };
  const explore: NavItem[] = [
    // The dashboard is a page of its own; /app is the search.
    { to: guest ? '/' : '/app/home', end: guest, label: tx.nav.home, Icon: House },
    { to: '/app', end: true, label: tx.nav.opportunities, Icon: Search },
    { to: '/app/map', end: false, label: tx.nav.map, Icon: MapIcon },
    { to: '/app/calendar', end: false, label: tx.nav.calendar, Icon: CalendarDays },
    // Programme pages belong to the guides section.
    { to: '/guides', end: false, label: tx.nav.guides, Icon: BookOpen, also: '/programs/' },
  ];
  const mine: NavItem[] = guest
    ? []
    : [
        { to: '/app/tracker', end: false, label: tx.nav.tracker, Icon: ListChecks },
        // The AI tools live on each opportunity page; this is their visible home.
        { to: '/app/ai', end: false, label: tx.nav.ai, Icon: Sparkles, badge: hasPremium(profile) ? undefined : '1/24h' },
        { to: '/app/profile', end: false, label: tx.nav.profile, Icon: UserRound },
        // Opportunities and Users live under one Admin entry (tabs inside).
        ...(profile?.is_admin
          ? [
              { to: '/admin', end: false, label: tx.nav.admin, Icon: Shield },
              // Admins can open the student section too (students never see this app).
              { to: '/student', end: false, label: tx.nav.student, Icon: GraduationCap },
            ]
          : []),
      ];
  const groups = [
    { label: tx.navGroups.explore, items: explore },
    { label: tx.navGroups.mine, items: mine },
  ].filter((g) => g.items.length);
  // Phones (max 5 tabs): guests get the explore tabs; members their daily pages.
  // Guides are linked from the dashboard; admin pages are for desktop.
  const pick = (...paths: string[]) => paths.flatMap((p) => [...explore, ...mine].filter((i) => i.to === p));
  const links = guest
    ? [...explore.filter((i) => i.to !== '/app/calendar'), { to: '/login', end: false, label: tx.guest.logIn, Icon: UserRound, state: back }]
    : pick('/app/home', '/app', '/app/map', '/app/tracker', '/app/profile');
  const activeFor = (item: NavItem, isActive: boolean) => isActive || (!!item.also && location.pathname.startsWith(item.also));
  const isPremium = isPaidPlan(profile?.plan);

  const logout = async () => {
    await backend.signOut();
    navigate('/login', { replace: true });
  };

  if (loading) return <Spinner />;
  // Student accounts don't see the regular app, its public pages included.
  if (isStudentOnly(profile)) return <Navigate to="/student" replace />;

  return (
    <DataProvider>
      <div className="app-surface min-h-screen lg:flex">
        {/* desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-white/90 p-5 shadow-[8px_0_30px_-28px_rgba(15,58,66,0.35)] backdrop-blur lg:flex print:!hidden">
          {/* Signed-in users never go back to the landing page from the logo. */}
          <Link to={guest ? '/' : '/app/home'} className="flex items-center gap-2 font-display text-[1.375rem] font-extrabold tracking-tight text-ink">
            <Logo className="h-8 w-8" />
            {BRAND}
          </Link>
          <nav className="mt-8 space-y-6" aria-label="App">
            {groups.map((g) => (
              <div key={g.label}>
                <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">{g.label}</p>
                <div className="space-y-1">
                  {g.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                          activeFor(item, isActive) ? 'bg-brand-50 text-brand-900 ring-1 ring-brand-100' : 'text-slate-600 hover:bg-paper hover:text-ink'
                        }`
                      }
                    >
                      <item.Icon className="h-4 w-4" aria-hidden="true" />
                      {item.label}
                      {item.badge && <span className="ml-auto rounded-full bg-coral-50 px-2 py-0.5 text-xs font-bold text-coral-800">{item.badge}</span>}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className="mt-auto space-y-3">
            <div className="flex rounded-full border border-line p-0.5 text-xs font-bold">
              {(['az', 'en'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`flex-1 rounded-full px-2.5 py-1 uppercase transition ${lang === l ? 'bg-brand-900 text-white' : 'text-slate-600'}`}
                >
                  {l}
                </button>
              ))}
            </div>
            {guest ? (
              <div className="space-y-2 rounded-2xl bg-paper p-3">
                <p className="text-sm text-slate-600">{tx.guest.sidebar}</p>
                <Link to="/register" state={back} className="btn-primary w-full !py-2 text-sm">
                  {tx.guest.signUp}
                </Link>
                <Link to="/login" state={back} className="btn-secondary w-full !py-2 text-sm">
                  {tx.guest.logIn}
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl bg-paper p-3">
                <Avatar profile={profile} />
                <Link to="/app/profile?tab=premium" className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-sm font-bold text-slate-900">{profile?.full_name || profile?.email}</span>
                  <span className={`block text-xs ${isPremium ? 'font-bold text-amber-600' : 'text-slate-500 hover:text-brand-700'}`}>
                    {profile?.plan === 'student' ? `🎓 ${tx.profile.student}` : isPremium ? `✦ ${tx.profile.premium}` : tx.profile.basic}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  title={tx.nav.logout}
                  aria-label={tx.nav.logout}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-rose-600"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-20 lg:pb-0 print:pb-0">
          {/* mobile top bar */}
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:hidden print:hidden">
            <Link to={guest ? '/' : '/app/home'} className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-ink">
              <Logo className="h-7 w-7" />
              {BRAND}
            </Link>
            <div className="flex items-center gap-2">
              {!guest && (
                <Link to="/app/profile" aria-label={tx.nav.profile}>
                  <Avatar profile={profile} className="h-8 w-8 text-[11px]" />
                </Link>
              )}
              <button
                type="button"
                onClick={() => setLang(lang === 'az' ? 'en' : 'az')}
                className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-bold uppercase text-slate-700"
              >
                {lang === 'az' ? 'en' : 'az'}
              </button>
              {guest ? (
                <Link to="/register" state={back} className="btn-primary !px-4 !py-1.5 text-sm">
                  {tx.guest.signUp}
                </Link>
              ) : (
                <button type="button" onClick={logout} aria-label={tx.nav.logout} className="rounded-lg p-2 text-slate-500 hover:text-rose-600">
                  <LogOut className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </div>
          </header>

          {backend.mode === 'demo' && <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800 print:hidden">{tx.demoBanner}</p>}

          <main className="mx-auto w-full max-w-6xl px-3.5 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-12 print:max-w-none print:p-0">
            <Outlet />
          </main>
        </div>

        {/* mobile bottom tabs */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 grid border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden print:hidden"
          style={{ gridTemplateColumns: `repeat(${links.length}, 1fr)` }}
          aria-label="App"
        >
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group flex flex-col items-center gap-0.5 py-2 text-xs font-semibold ${activeFor(item, isActive) ? 'active text-brand-900' : 'text-slate-500'}`
              }
            >
              <span className="flex h-7 w-12 items-center justify-center rounded-full group-[.active]:bg-brand-50">
                <item.Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="max-w-full truncate px-1">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </DataProvider>
  );
}
