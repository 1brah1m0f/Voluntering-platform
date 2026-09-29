import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ListChecks, LogOut, Search, Shield, UserRound } from 'lucide-react';
import { BRAND } from '../config';
import { Logo } from '../components/Icons';
import { useLang } from '../i18n';
import { backend } from './backend';
import { useAuth } from './AuthContext';
import { DataProvider } from './DataContext';
import { useAppText } from './text';
import { Avatar, Spinner } from './ui';

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

  const links = guest
    ? [{ to: '/app', end: true, label: tx.nav.opportunities, Icon: Search }]
    : [
        { to: '/app', end: true, label: tx.nav.opportunities, Icon: Search },
        { to: '/app/tracker', end: false, label: tx.nav.tracker, Icon: ListChecks },
        { to: '/app/profile', end: false, label: tx.nav.profile, Icon: UserRound },
        // Opportunities and Users live under one Admin entry (tabs inside).
        ...(profile?.is_admin ? [{ to: '/admin', end: false, label: tx.nav.admin, Icon: Shield }] : []),
      ];
  const isPremium = profile?.plan === 'premium';

  const logout = async () => {
    await backend.signOut();
    navigate('/login', { replace: true });
  };

  if (loading) return <Spinner />;

  return (
    <DataProvider>
      <div className="min-h-screen bg-slate-50 lg:flex">
        {/* desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-5 lg:flex">
          <Link to="/" className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <Logo className="h-8 w-8" />
            {BRAND}
          </Link>
          <nav className="mt-8 space-y-1" aria-label="App">
            {links.map(({ to, end, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    isActive ? 'bg-brand-50 text-brand-800 ring-1 ring-brand-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto space-y-3">
            <div className="flex rounded-full border border-slate-200 p-0.5 text-xs font-bold">
              {(['az', 'en'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`flex-1 rounded-full px-2.5 py-1 uppercase transition ${lang === l ? 'bg-brand-700 text-white' : 'text-slate-600'}`}
                >
                  {l}
                </button>
              ))}
            </div>
            {guest ? (
              <div className="space-y-2 rounded-2xl bg-slate-50 p-3">
                <p className="text-sm text-slate-600">{tx.guest.sidebar}</p>
                <Link to="/register" state={back} className="btn-primary w-full !py-2 text-sm">
                  {tx.guest.signUp}
                </Link>
                <Link to="/login" state={back} className="btn-secondary w-full !py-2 text-sm">
                  {tx.guest.logIn}
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <Avatar profile={profile} />
                <Link to="/app/profile?tab=premium" className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-sm font-bold text-slate-900">{profile?.full_name || profile?.email}</span>
                  <span className={`block text-xs ${isPremium ? 'font-bold text-amber-600' : 'text-slate-500 hover:text-brand-700'}`}>
                    {isPremium ? `✦ ${tx.profile.premium}` : tx.profile.basic}
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

        <div className={`min-w-0 flex-1 lg:pb-0 ${guest ? '' : 'pb-20'}`}>
          {/* mobile top bar */}
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
            <Link to="/" className="flex items-center gap-2 font-extrabold text-slate-900">
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

          {backend.mode === 'demo' && <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">{tx.demoBanner}</p>}

          <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
            <Outlet />
          </main>
        </div>

        {/* mobile bottom tabs */}
        {!guest && (
          <nav
            className="fixed inset-x-0 bottom-0 z-40 grid border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden"
            style={{ gridTemplateColumns: `repeat(${links.length}, 1fr)` }}
            aria-label="App"
          >
            {links.map(({ to, end, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-xs font-semibold ${isActive ? 'text-brand-700' : 'text-slate-500'}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </DataProvider>
  );
}
