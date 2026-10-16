import { useEffect, useState, type ReactNode } from 'react';
import type { PlanNotification } from './backend';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Code2, Bookmark, Compass, BookOpen, CalendarDays, GraduationCap, House, ListChecks, LogOut, Map as MapIcon, Search, Shield, Sparkles, UserRound, type LucideIcon } from 'lucide-react';
import { BRAND } from '../config';
import { Logo } from '../components/Icons';
import ThemeToggle from '../components/ThemeToggle';
import { useLang } from '../i18n';
import { backend } from './backend';
import { useAuth } from './AuthContext';
import { hackathonText } from './hackathons/text';
import { DataProvider } from './DataContext';
import { useAppText } from './text';
import { Avatar, Spinner } from './ui';
import { hasPremium, homeFor, isPaidPlan, isRegularOnly, isStudentOnly } from './plans';

/** Durable activation messages are shared by the regular and student shells. */
function PlanNotifications() {
  const { userId, refresh } = useAuth();
  const { lang } = useLang();
  const [messages, setMessages] = useState<PlanNotification[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    let running = false;
    let previousIds = '';
    setMessages([]);
    setError(false);
    const load = async () => {
      if (!userId || running || document.hidden) return;
      running = true;
      try {
        const rows = await backend.listPlanNotifications();
        if (!active) return;
        setMessages(rows);
        const ids = rows.map(row => row.id).join(',');
        if (ids && ids !== previousIds) void refresh();
        previousIds = ids;
      } catch (err) {
        console.error('[plan notifications]', err);
      } finally { running = false; }
    };
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    const onFocus = () => void load();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [userId, refresh]);
  const dismiss = async (id: string) => {
    try {
      await backend.dismissPlanNotification(id);
      setMessages(rows => rows.filter(row => row.id !== id));
      setError(false);
    } catch { setError(true); }
  };
  return <div aria-live="polite">
    {messages.map(message => <div key={message.id} role="status" className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
      <div>
        <p className="font-bold">{lang === 'az' ? `🎉 ${message.plan === 'student' ? 'Tələbə planın' : 'Premium planın'} aktivləşdirildi!` : `🎉 Your ${message.plan === 'student' ? 'Student' : 'Premium'} plan has been activated!`}</p>
        <p className="mt-1 text-sm">{lang === 'az' ? 'Planına daxil olan bütün imkanlardan indi istifadə edə bilərsən.' : 'You can now use all the features included in your plan.'}</p>
      </div>
      <button type="button" onClick={() => void dismiss(message.id)} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-amber-100">{lang === 'az' ? 'Bağla' : 'Dismiss'}</button>
    </div>)}
    {error && <p role="alert" className="mb-3 text-sm text-red-700">{lang === 'az' ? 'Mesaj bağlanmadı. Yenidən cəhd et.' : 'Could not dismiss the message. Please try again.'}</p>}
  </div>;
}

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
      <main className="mx-auto w-full max-w-7xl px-3.5 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-12">
        <div className="mb-4 flex items-center justify-between gap-2 rounded-2xl border border-line bg-white px-3 py-2.5 shadow-xs sm:mb-5 sm:gap-3 sm:px-5 sm:py-3">
          <Link to="/student" className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-ink">
            <Logo className="h-7 w-7" />
            {BRAND} <span className="hidden text-sm font-bold text-brand-700 sm:inline">Student</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
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
                `flex items-center gap-2 rounded-full py-1 pl-1 pr-1 text-sm font-bold transition sm:pr-3 ${isActive ? 'bg-brand-50 text-brand-900' : 'text-slate-600 hover:bg-paper hover:text-ink'}`
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
        <PlanNotifications />
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

  const discovery = profile?.is_admin ? profile.prefs?.discovery_mode : undefined;
  const hackOnly = discovery === 'hackathons';
  const ht = hackathonText[lang];

  type NavItem = { to: string; end: boolean; label: string; Icon: LucideIcon; also?: string; badge?: string };
  const volunteeringNav: NavItem[] = [
    // The dashboard is a page of its own; /app is the search.
    ...(guest ? [] : [{ to: '/app/home', end: false, label: tx.nav.home, Icon: House }]),
    { to: '/app', end: true, label: tx.nav.opportunities, Icon: Search },
    { to: '/app/map', end: false, label: tx.nav.map, Icon: MapIcon },
    { to: '/app/calendar', end: false, label: tx.nav.calendar, Icon: CalendarDays },
    // Programme pages belong to the guides section.
    { to: '/guides', end: false, label: tx.nav.guides, Icon: BookOpen, also: '/programs/' },
  ];
  const explore: NavItem[] = hackOnly ? [
    { to: '/app/hackathons', end: false, label: ht.title, Icon: Code2 },
  ] : [
    ...volunteeringNav,
    ...(profile?.is_admin && discovery === 'both' ? [{ to: '/app/hackathons', end: false, label: ht.title, Icon: Code2 }] : []),
  ];
  const mine: NavItem[] = guest
    ? []
    : [
        ...(hackOnly ? [{ to: '/app/hackathons?saved=1', end: false, label: ht.savedOnly, Icon: Bookmark }] : [{ to: '/app/tracker', end: false, label: tx.nav.tracker, Icon: ListChecks }]),
        // The AI tools live on each opportunity page; this is their visible home.
        ...(hackOnly ? [] : [{ to: '/app/ai', end: false, label: tx.nav.ai, Icon: Sparkles, badge: hasPremium(profile) ? undefined : '1/24h' }]),
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
  const links = guest ? explore.filter((i) => i.to !== '/app/calendar') : hackOnly ? pick('/app/hackathons', '/app/hackathons?saved=1', '/app/profile', '/admin') : discovery === 'both' ? pick('/app/home', '/app', '/app/hackathons', '/app/tracker', '/app/profile') : pick('/app/home', '/app', '/app/map', '/app/tracker', '/app/profile');
  const activeFor = (item: NavItem, isActive: boolean) => {
    if (item.to.startsWith('/app/hackathons')) {
      const savedTab = item.to.includes('?saved=1');
      const savedView = new URLSearchParams(location.search).get('saved') === '1';
      return location.pathname.startsWith('/app/hackathons') && savedTab === savedView;
    }
    return isActive || (!!item.also && location.pathname.startsWith(item.also));
  };
  const isPremium = isPaidPlan(profile?.plan);

  const logout = async () => {
    await backend.signOut();
    navigate('/login', { replace: true });
  };

  if (loading) return <Spinner />;
  // Student accounts don't see the regular app, its public pages included.
  if (isStudentOnly(profile)) return <Navigate to="/student" replace />;
  if (profile?.is_admin && ['/app', '/app/home'].includes(location.pathname)) {
    if (!discovery) return <Navigate to="/app/discover" replace />;
    if (hackOnly) return <Navigate to="/app/hackathons" replace />;
  }

  return (
    <DataProvider>
      <div className="app-surface min-h-screen lg:flex">
        {/* desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-white p-5 lg:flex print:hidden!">
          {/* Signed-in users never go back to the landing page from the logo. */}
          <Link to={guest ? '/' : homeFor(profile)} className="flex shrink-0 items-center gap-2 font-display text-[1.375rem] font-extrabold tracking-tight text-ink">
            <Logo className="h-8 w-8" />
            {BRAND}
          </Link>
          <nav className="mt-8 min-h-0 space-y-6 overflow-y-auto pb-4" aria-label="App">
            {groups.map((g) => (
              <div key={g.label}>
                <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">{g.label}</p>
                <div className="space-y-1">
                  {g.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                          activeFor(item, isActive) ? 'bg-brand-50 text-brand-900' : 'text-slate-600 hover:bg-paper hover:text-ink'
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
          <div className="mt-auto shrink-0 space-y-3">
            <ThemeToggle showLabel />
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
                <Link to="/register" state={back} className="btn-primary w-full py-2! text-sm">
                  {tx.guest.signUp}
                </Link>
                <Link to="/login" state={back} className="btn-secondary w-full py-2! text-sm">
                  {tx.guest.logIn}
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl bg-paper p-3">
                <Avatar profile={profile} />
                <Link to="/app/profile?tab=premium" className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-sm font-bold text-slate-900">{profile?.full_name || profile?.email}</span>
                  <span className={`block text-xs ${isPremium ? 'font-bold text-amber-800' : 'text-slate-500 hover:text-brand-700'}`}>
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
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-white/90 px-4 py-3 backdrop-blur-sm lg:hidden print:hidden">
            <Link to={guest ? '/' : homeFor(profile)} className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-ink">
              <Logo className="h-7 w-7" />
              {BRAND}
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <ThemeToggle />
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
              {/* Signed-in users log out from Profile → Settings; an icon here was easy to tap by mistake. */}
              {guest && (
                <Link to="/register" state={back} className="btn-primary px-3! py-1.5! text-sm">
                  {tx.guest.signUp}
                </Link>
              )}
            </div>
          </header>

          {backend.mode === 'demo' && <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800 print:hidden">{tx.demoBanner}</p>}

          <main className="mx-auto w-full max-w-6xl px-3.5 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-8 print:max-w-none print:p-0">
            {profile?.is_admin && location.pathname !== '/app/discover' && <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 text-xs">
              <span className="inline-flex items-center gap-2 font-semibold text-brand-700"><Compass className="h-4 w-4" aria-hidden="true" />{discovery === 'hackathons' ? ht.hackathons : discovery === 'both' ? ht.both : ht.volunteering}</span>
              <Link className="font-semibold text-slate-500 hover:text-brand-700" to="/app/discover">{ht.change} →</Link>
            </div>}
            <PlanNotifications />
            <Outlet />
          </main>
        </div>

        {/* mobile bottom tabs */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 grid border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden print:hidden"
          style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}
          aria-label="App"
        >
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group flex min-w-0 flex-col items-center gap-0.5 py-2 text-xs font-semibold ${activeFor(item, isActive) ? 'active text-brand-900' : 'text-slate-500'}`
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
