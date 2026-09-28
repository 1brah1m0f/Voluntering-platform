import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Crown, ListChecks, LogOut, Search, Shield, UserRound, Users } from 'lucide-react';
import { BRAND } from '../config';
import { Logo } from '../components/Icons';
import { useLang } from '../i18n';
import { backend } from './backend';
import { useAuth } from './AuthContext';
import { DataProvider } from './DataContext';
import { useAppText } from './text';
import { Spinner } from './ui';

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

export default function AppLayout() {
  const { tx } = useAppText();
  const { lang, setLang } = useLang();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const links = [
    { to: '/app', end: true, label: tx.nav.opportunities, Icon: Search },
    { to: '/app/tracker', end: false, label: tx.nav.tracker, Icon: ListChecks },
    { to: '/app/premium', end: false, label: tx.nav.premium, Icon: Crown },
    { to: '/app/profile', end: false, label: tx.nav.profile, Icon: UserRound },
  ];
  // Desktop sidebar lists both admin pages; the mobile tab bar has room for one.
  const adminLinks = profile?.is_admin
    ? [
        { to: '/admin', end: true, label: tx.nav.admin, Icon: Shield },
        { to: '/admin/users', end: false, label: tx.nav.users, Icon: Users },
      ]
    : [];
  const mobileLinks = profile?.is_admin ? [...links, { to: '/admin', end: false, label: tx.nav.admin, Icon: Shield }] : links;
  const isPremium = profile?.plan === 'premium';

  const logout = async () => {
    await backend.signOut();
    navigate('/login', { replace: true });
  };

  const initials = (profile?.full_name || profile?.email || '?')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
            {[...links, ...adminLinks].map(({ to, end, label, Icon }) => (
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
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-xs font-bold text-white">{initials}</span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-sm font-bold text-slate-900">{profile?.full_name || profile?.email}</span>
                <span className={`block text-xs ${isPremium ? 'font-bold text-amber-600' : 'text-slate-500'}`}>{isPremium ? `✦ ${tx.profile.premium}` : tx.profile.basic}</span>
              </span>
              <button type="button" onClick={logout} title={tx.nav.logout} aria-label={tx.nav.logout} className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-rose-600">
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-20 lg:pb-0">
          {/* mobile top bar */}
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
            <Link to="/" className="flex items-center gap-2 font-extrabold text-slate-900">
              <Logo className="h-7 w-7" />
              {BRAND}
            </Link>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setLang(lang === 'az' ? 'en' : 'az')} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-bold uppercase text-slate-700">
                {lang === 'az' ? 'en' : 'az'}
              </button>
              <button type="button" onClick={logout} aria-label={tx.nav.logout} className="rounded-lg p-2 text-slate-500 hover:text-rose-600">
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </header>

          {backend.mode === 'demo' && <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">{tx.demoBanner}</p>}

          <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
            <Outlet />
          </main>
        </div>

        {/* mobile bottom tabs */}
        <nav className="fixed inset-x-0 bottom-0 z-40 grid border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden" style={{ gridTemplateColumns: `repeat(${mobileLinks.length}, 1fr)` }} aria-label="App">
          {mobileLinks.map(({ to, end, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${isActive ? 'text-brand-700' : 'text-slate-500'}`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </DataProvider>
  );
}
