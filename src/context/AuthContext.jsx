/**
 * @file src/context/AuthContext.jsx
 * @description Global authentication context for Bocage Champagne Society.
 * Provides user session, profile data, single membership row, admin status,
 * and auth actions (signIn, signOut) to all child components.
 * Self-signup is intentionally not exposed — Society is invite-only and
 * accounts are created by the owners via bocage /admin -> Society CRM.
 *
 * NOTE: Society uses a single membership product (no tiers, no points).
 * The `bocage_memberships` row exists per-user solely to track join date
 * and an optional status — there is no tier_id and no points column.
 *
 * @importedBy src/App.jsx (wraps entire app), src/pages/*.jsx (consume context)
 * @imports src/lib/supabase.js, src/lib/capacitor.js
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { registerPushNotifications } from '../lib/capacitor';

/** @type {React.Context} */
const AuthContext = createContext(null);

/**
 * Hook to access auth context values from any component.
 * @returns {{ user, profile, membership, isAdmin, loading, signIn, signOut }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

/**
 * AuthProvider wraps the app and manages:
 * - Supabase auth session (user)
 * - Profile data from the bocage_profiles table
 * - Membership row from bocage_memberships (single product — joined_at, status)
 * - Admin role detection
 * - Sign in, sign up, sign out functions
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);

  /** Whether the current user has the admin role */
  const isAdmin = profile?.role === 'admin';

  /**
   * Fetches the user's profile and membership row from Supabase.
   * Called after auth state changes (login, signup, session restore).
   * @param {string} userId - The authenticated user's UUID
   */
  async function fetchUserData(userId) {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('bocage_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(profileData);

      // Fetch membership row (single product — no tier join, no points)
      const { data: membershipData } = await supabase
        .from('bocage_memberships')
        .select('*')
        .eq('user_id', userId)
        .single();
      setMembership(membershipData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  // Listen for auth state changes and restore session on mount
  useEffect(() => {
    let cancelled = false;

    // Email-confirmation callback for LEGACY self-signup accounts:
    // Supabase auto-creates a session from the URL hash (access_token,
    // refresh_token, type=signup) on confirmation. For old accounts that
    // signed up before Society went invite-only, force-signout and land them
    // on the login screen with a "Email verified" banner.
    //
    // We deliberately do NOT intercept type=invite, type=recovery, or
    // type=magiclink — those flows need the auto-created session to keep
    // working (new members accepting an invite should land in the app with
    // a usable session so they can set their password and start browsing).
    const hash = window.location.hash;
    const isLegacyConfirm = hash && (hash.includes('type=signup') || hash.includes('type=email_change'));
    if (isLegacyConfirm) {
      supabase.auth.signOut().finally(() => {
        if (cancelled) return;
        sessionStorage.setItem('bocage_just_confirmed', '1');
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        setUser(null);
        setProfile(null);
        setMembership(null);
        setLoading(false);
      });
      return () => { cancelled = true; };
    }

    // Safety failsafe — never let the loading splash stick longer than 4s.
    // If getSession() ever hangs (network stall, broken localStorage, etc.)
    // we still drop into Auth.jsx instead of showing the rocking-glass forever.
    const failsafe = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 4000);

    // Get initial session — handle resolution, rejection, and always clear loading.
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return;
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserData(session.user.id);
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to restore Supabase session:', err);
      })
      .finally(() => {
        if (cancelled) return;
        clearTimeout(failsafe);
        setLoading(false);
      });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setProfile(null);
          setMembership(null);
        }
      }
    );

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Signs in a user with email and password.
   * On native platforms, also registers for push notifications.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{error: Error|null}>}
   */
  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      // Register push token on native after login
      const token = await registerPushNotifications();
      if (token) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          await supabase
            .from('bocage_profiles')
            .update({ push_token: token })
            .eq('id', currentUser.id);
        }
      }
    }
    return { error };
  }

  /**
   * Signs the current user out and clears local state.
   * @returns {Promise<void>}
   */
  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setMembership(null);
  }

  const value = {
    user,
    profile,
    membership,
    isAdmin,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
