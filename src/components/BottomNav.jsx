// BottomNav.jsx — persistent mobile navigation.
// Rendered once in App.jsx; hides itself on auth screens and on desktop.
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Sparkles, Users, User } from 'lucide-react';

// Screens that should never show the bar
const HIDDEN_ON = ['/login', '/register', '/forgot-password', '/reset-password', '/welcome'];

const ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/projects', label: 'Projects', icon: LayoutGrid },
  { to: '/challenges', label: 'Challenges', icon: Sparkles },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const location = useLocation();
  if (HIDDEN_ON.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <nav
      aria-label="Main"
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-stone-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="flex items-stretch">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2 min-h-[52px] transition ${
                  isActive ? 'text-[#EA580C]' : 'text-stone-400 hover:text-stone-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.4 : 1.8} />
                  <span className={`text-[10px] leading-none ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}