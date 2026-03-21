/**
 * @file src/App.jsx
 * @description Root component for Bocage Champagne Society.
 * Sets up React Router, wraps the app in AuthProvider + ToastProvider + ErrorBoundary,
 * and conditionally renders Auth (no session) or AppLayout (authenticated).
 * @importedBy src/main.jsx
 * @imports src/context/AuthContext.jsx, src/components/ui/Toast.jsx,
 *          src/components/ErrorBoundary.jsx, src/components/layout/AppLayout.jsx, src/pages/*.jsx
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import AppLayout from './components/layout/AppLayout';
import Auth from './pages/Auth';
import Menu from './pages/Menu';
import Membership from './pages/Membership';
import Events from './pages/Events';
import AtHome from './pages/AtHome';
import Profile from './pages/Profile';
import AdminInventory from './pages/AdminInventory';
import { Wine } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * AppRoutes — conditionally renders Auth or main app based on auth state.
 * Shows a branded loading splash while checking session.
 * @returns {JSX.Element}
 */
function AppRoutes() {
  const { user, loading } = useAuth();

  // Branded loading splash
  if (loading) {
    return (
      <div className="min-h-screen bg-noir-900 flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Wine className="text-champagne-500" size={48} />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="font-display text-2xl text-gradient-gold mt-4"
        >
          Bocage
        </motion.p>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 120 }}
          transition={{ delay: 0.5, duration: 1.5, ease: 'easeOut' }}
          className="h-0.5 bg-gradient-to-r from-transparent via-champagne-500 to-transparent mt-4"
        />
      </div>
    );
  }

  // Not authenticated
  if (!user) return <Auth />;

  // Authenticated — main app with routes
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Menu />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/events" element={<Events />} />
        <Route path="/at-home" element={<AtHome />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/inventory" element={<AdminInventory />} />
      </Route>
    </Routes>
  );
}

/**
 * App component — top-level wrapper with ErrorBoundary, Router, Auth, and Toast providers.
 * @returns {JSX.Element}
 */
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
