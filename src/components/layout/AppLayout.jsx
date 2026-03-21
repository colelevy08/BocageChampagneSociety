/**
 * @file src/components/layout/AppLayout.jsx
 * @description Main layout wrapper for authenticated pages.
 * Renders the current page via React Router's Outlet with animated
 * page transitions (Framer Motion), plus the bottom TabBar.
 * @importedBy src/App.jsx (as route layout element)
 * @imports src/components/layout/TabBar.jsx, framer-motion, react-router-dom
 */

import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TabBar from './TabBar';

/**
 * Page transition animation variants for Framer Motion.
 * Fades in from slight upward offset.
 */
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

/**
 * AppLayout component — wraps all authenticated pages.
 * Provides:
 * - Safe area top padding for native status bars
 * - AnimatePresence for smooth page transitions
 * - Bottom TabBar with glass morphism
 * - Bottom padding to clear the tab bar
 *
 * @returns {JSX.Element}
 */
export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-noir-900 safe-top">
      {/* Page content area with bottom padding to clear TabBar */}
      <main className="pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <TabBar />
    </div>
  );
}
