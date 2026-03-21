/**
 * @file src/components/layout/TabBar.jsx
 * @description Bottom tab navigation bar with glass morphism styling.
 * Shows tabs for Menu, Society (Membership), Events, At Home, Profile,
 * and conditionally an Inventory tab for admin users.
 * @importedBy src/components/layout/AppLayout.jsx
 * @imports react-router-dom, lucide-react, src/context/AuthContext.jsx
 */

import { NavLink } from 'react-router-dom';
import {
  Wine,
  Crown,
  CalendarDays,
  Sparkles,
  User,
  Package,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Tab configuration — defines the label, path, and icon for each tab.
 * The admin inventory tab is conditionally added based on user role.
 */
const tabs = [
  { label: 'Menu', path: '/', icon: Wine },
  { label: 'Society', path: '/membership', icon: Crown },
  { label: 'Events', path: '/events', icon: CalendarDays },
  { label: 'At Home', path: '/at-home', icon: Sparkles },
  { label: 'Profile', path: '/profile', icon: User },
];

/** Admin-only inventory tab */
const adminTab = { label: 'Inventory', path: '/admin/inventory', icon: Package };

/**
 * TabBar component — fixed bottom navigation with glass morphism.
 * Highlights the active tab with champagne gold color.
 * Shows the Inventory tab only for admin users.
 *
 * @returns {JSX.Element}
 */
export default function TabBar() {
  const { isAdmin } = useAuth();

  // Build tab list, inserting admin tab before Profile if user is admin
  const visibleTabs = isAdmin
    ? [...tabs.slice(0, 4), adminTab, tabs[4]]
    : tabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass safe-bottom z-50">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {visibleTabs.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 text-xs font-sans transition-colors ${
                isActive
                  ? 'text-champagne-500'
                  : 'text-noir-300 hover:text-noir-100'
              }`
            }
          >
            <Icon size={22} strokeWidth={1.5} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
