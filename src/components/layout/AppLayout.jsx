/**
 * @file src/components/layout/AppLayout.jsx
 * @description Main layout wrapper for authenticated pages.
 * Renders the current page via React Router's Outlet with animated transitions,
 * the bottom TabBar, an offline banner, and scroll-to-top on navigation.
 * @importedBy src/App.jsx (as route layout element)
 * @imports src/components/layout/TabBar.jsx, src/hooks/useOnlineStatus.js,
 *          framer-motion, react-router-dom
 */

import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, ArrowLeft } from 'lucide-react';
import TabBar from './TabBar';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

/** Page transition animation variants */
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

/**
 * AppLayout component — wraps all authenticated pages with:
 * - Safe area padding
 * - Animated page transitions
 * - Offline connectivity banner
 * - Scroll restoration on navigation
 * - Bottom TabBar
 *
 * @returns {JSX.Element}
 */
export default function AppLayout() {
  const location = useLocation();
  const isOnline = useOnlineStatus();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-noir-900 safe-top">
      {/* Offline banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="offline-banner text-center py-2 px-4 z-50"
          >
            <p className="flex items-center justify-center gap-2 text-xs font-sans text-white">
              <WifiOff size={14} />
              You're offline — some features may be unavailable
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent return-to-main-site link. Uses an absolute URL so it
          works both when Society is accessed via bocage.vercel.app/society/*
          (proxy) and direct at bocage-champagne-society.vercel.app/society/*,
          where a relative "/" would just bounce back to Society's own root. */}
      <a
        href="https://bocagechampagnebar.com/"
        className="block text-center py-2 px-4 border-b border-noir-800 font-sans text-[11px] text-noir-400 hover:text-champagne-500 tracking-wider uppercase transition-colors"
      >
        <span className="inline-flex items-center gap-1.5">
          <ArrowLeft size={11} />
          Bocage Champagne Bar
        </span>
      </a>

      {/* Page content with padding for TabBar */}
      <main className="pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <TabBar />
    </div>
  );
}
