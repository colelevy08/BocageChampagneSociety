/**
 * @file src/context/AuthContext.jsx
 * @description Global authentication context for Bocage Champagne Society.
 * Provides user session, profile data, membership info, admin status,
 * and auth actions (signIn, signUp, signOut) to all child components.
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
 * @returns {{ user, profile, membership, tier, isAdmin, loading, signIn, signUp, signOut }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

/**
 * AuthProvider wraps the app and manages:
 * - Supabase auth session (user)
 * - Profile data from the profiles table
 * - Membership + tier info from memberships + membership_tiers
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
  const [tier, setTier] = useState(null);
  const [loading, setLoading] = useState(true);

  /** Whether the current user has the admin role */
  const isAdmin = profile?.role === 'admin';

  /**
   * Fetches the user's profile, membership, and tier data from Supabase.
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

      // Fetch membership with joined tier data
      const { data: membershipData } = await supabase
        .from('bocage_memberships')
        .select('*, bocage_membership_tiers(*)')
        .eq('user_id', userId)
        .single();

      if (membershipData) {
        setMembership(membershipData);
        setTier(membershipData.bocage_membership_tiers);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  // Listen for auth state changes and restore session on mount
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
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
          setTier(null);
        }
      }
    );

    return () => subscription.unsubscribe();
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
   * Creates a new user account with email and password.
   * The database trigger auto-creates profile + Flûte membership.
   * @param {string} email
   * @param {string} password
   * @param {string} fullName
   * @returns {Promise<{error: Error|null}>}
   */
  async function signUp(email, password, fullName) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
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
    setTier(null);
  }

  const value = {
    user,
    profile,
    membership,
    tier,
    isAdmin,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
