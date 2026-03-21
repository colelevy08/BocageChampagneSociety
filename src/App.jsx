/**
 * @file src/App.jsx
 * @description Root component for Bocage Champagne Society.
 * Sets up React Router with BrowserRouter, wraps the app in AuthProvider,
 * and conditionally renders the Auth page (no session) or the main
 * AppLayout with tab navigation (authenticated).
 * @importedBy src/main.jsx
 * @imports src/context/AuthContext.jsx, src/components/layout/AppLayout.jsx, src/pages/*.jsx
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Auth from './pages/Auth';
import Menu from './pages/Menu';
import Membership from './pages/Membership';
import Events from './pages/Events';
import AtHome from './pages/AtHome';
import Profile from './pages/Profile';
import AdminInventory from './pages/AdminInventory';
import { Wine } from 'lucide-react';

/**
 * AppRoutes — conditionally renders Auth page or main app routes
 * based on authentication state.
 * @returns {JSX.Element}
 */
function AppRoutes() {
  const { user, loading } = useAuth();

  // Loading splash screen
  if (loading) {
    return (
      <div className="min-h-screen bg-noir-900 flex flex-col items-center justify-center">
        <Wine className="text-champagne-500 animate-pulse" size={48} />
        <p className="font-display text-xl text-gradient-gold mt-4">Bocage</p>
      </div>
    );
  }

  // Not authenticated — show login/signup
  if (!user) {
    return <Auth />;
  }

  // Authenticated — show main app with tab navigation
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
 * App component — top-level wrapper providing routing and auth context.
 * @returns {JSX.Element}
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
