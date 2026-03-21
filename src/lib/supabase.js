/**
 * @file src/lib/supabase.js
 * @description Initializes and exports the Supabase client for Bocage Champagne Society.
 * Reads credentials from VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env vars.
 * @importedBy src/context/AuthContext.jsx, src/pages/*.jsx (data fetching)
 * @imports @supabase/supabase-js
 */

import { createClient } from '@supabase/supabase-js';

/** Supabase project URL from environment variables */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

/** Supabase anonymous/public key from environment variables */
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase credentials. Copy .env.example to .env.local and fill in your project values.'
  );
}

/**
 * Supabase client instance used throughout the app for auth, database queries,
 * and storage operations.
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
