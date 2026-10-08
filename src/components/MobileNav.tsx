import { NavLink } from 'react-router-dom';
import { House, Search, Map as MapIcon, BookOpen, UserRound } from 'lucide-react';
import { useAppText } from '../app/text';

export default function MobileNav() {
  const { tx } = useAppText();
  
  const links = [
    { to: '/', end: true, label: tx.nav.home, Icon: House },
    { to: '/app', end: true, label: tx.nav.opportunities, Icon: Search },
    { to: '/app/map', end: false, label: tx.nav.map, Icon: MapIcon },
    { to: '/guides', end: false, label: tx.nav.guides, Icon: BookOpen },
    { to: '/login', end: false, label: tx.guest.logIn, Icon: UserRound }
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden print:hidden"
      style={{ gridTemplateColumns: `repeat(${links.length}, 1fr)` }}
      aria-label="Mobile Navigation"
    >
      {links.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `group flex flex-col items-center gap-0.5 py-2 text-xs font-semibold ${isActive ? 'active text-brand-900' : 'text-slate-500 hover:text-slate-700'}`
          }
        >
          <span className="flex h-7 w-12 items-center justify-center rounded-full transition group-[.active]:bg-brand-50">
            <item.Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="max-w-full truncate px-1">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
