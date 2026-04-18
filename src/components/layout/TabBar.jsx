/**
 * @file src/components/layout/TabBar.jsx
 * @description Bottom tab navigation bar with glass morphism, animated active indicator,
 * and conditional admin tabs (Inventory + CRM). Features smooth icon transitions and haptic feedback.
 * @importedBy src/components/layout/AppLayout.jsx
 * @imports react-router-dom, lucide-react, src/context/AuthContext.jsx, src/hooks/useHaptics.js
 */

import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wine,
  CalendarDays,
  Sparkles,
  User,
  Package,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHaptics } from '../../hooks/useHaptics';

/** Tab configuration — base tabs for all authenticated users */
const tabs = [
  { label: 'Menu',    path: '/',           icon: Wine         },
  { label: 'Events',  path: '/events',     icon: CalendarDays },
  { label: 'At Home', path: '/at-home',    icon: Sparkles     },
  { label: 'Profile', path: '/profile',    icon: User         },
];

/** Admin-only tabs injected before Profile */
const adminTabs = [
  { label: 'Inventory', path: '/admin/inventory', icon: Package },
  { label: 'CRM',       path: '/admin/crm',       icon: Users   },
];

/**
 * TabBar — fixed bottom navigation with glass morphism and animated active states.
 * @returns {JSX.Element}
 */
export default function TabBar() {
  const { isAdmin } = useAuth();
  const haptics = useHaptics();
  const location = useLocation();

  // Insert admin tabs before Profile when user is admin
  const visibleTabs = isAdmin
    ? [...tabs.slice(0, 4), ...adminTabs, ...tabs.slice(4)]
    : tabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-elevated safe-bottom z-50">
      <div className="flex items-center justify-around px-1 pt-1.5 pb-1">
        {visibleTabs.map(({ label, path, icon: Icon }) => {
          const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path);

          return (
            <NavLink
              key={path}
              to={path}
              onClick={() => haptics.selection()}
              className="relative flex flex-col items-center gap-0.5 px-2 py-1 min-w-0"
            >
              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="tabIndicator"
                  className="absolute -top-1 w-5 h-0.5 rounded-full bg-champagne-500"
                  transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                />
              )}

              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -1 : 0,
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2 : 1.5}
                  className={`transition-colors duration-200 ${
                    isActive ? 'text-champagne-500' : 'text-noir-400'
                  }`}
                />
              </motion.div>
              <span
                className={`text-[10px] font-sans transition-colors duration-200 ${
                  isActive ? 'text-champagne-500 font-medium' : 'text-noir-400'
                }`}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
