/**
 * @file src/pages/Auth.jsx
 * @description Login and signup screen for Bocage Champagne Society.
 * Features Bocage branding with animated logo, email/password auth,
 * password strength indicator, terms acceptance, and smooth mode transitions.
 * @importedBy src/App.jsx (rendered when user is not authenticated)
 * @imports src/context/AuthContext.jsx, src/components/ui/Input.jsx,
 *          src/components/ui/Button.jsx, framer-motion, lucide-react
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wine, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocietyContent } from '../lib/societyContent';

/**
 * Auth page component — handles login, signup, and forgot password flows.
 * Features animated background particles, password strength meter,
 * and staggered form entrance animations.
 *
 * @returns {JSX.Element}
 */
// Society membership is purchased on the public marketing site at
// bocagechampagnebar.com/society — anyone can buy an Individual or Couples
// tier directly through Square. After payment the bocage main repo's
// /api/checkout-webhook creates the auth user via Supabase admin invite
// and sends a Bocage-branded welcome email via Resend with a magic link
// the new member clicks to set their password.
//
// Owners can also manually invite a member from /admin > Bocage Champagne
// Society (api/admin-society) without taking payment, for comps / press
// trial memberships / partner accounts.
//
// In both cases this Auth screen is what the magic link drops the new
// member on after they set their password — i.e. it's a *login* surface
// for established members, not a self-signup surface.
const MEMBERSHIP_URL = 'https://www.bocagechampagnebar.com/society';
const INQUIRE_EMAIL = 'clark@bocagechampagnebar.com';
const INQUIRE_SUBJECT = 'Bocage Champagne Society — Question';

// Forgot-password flow calls a bocage main repo endpoint that generates a
// recovery link via Supabase admin API and sends a branded email via Resend
// (so the recipient gets a real Bocage email, not the default Supabase one).
// Absolute URL because Society can be reached at either
// bocage-champagne-society.vercel.app or bocagechampagnebar.com/society —
// the bocage main repo serves the same .vercel.app URL either way.
const PASSWORD_RESET_URL = 'https://bocage.vercel.app/api/society-request-password-reset';

export default function Auth() {
  const { signIn } = useAuth();
  const { taglines: TAGLINES } = useSocietyContent();
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [taglineIndex, setTaglineIndex] = useState(0);

  // Detect email verification callback. AuthContext intercepts the confirmation
  // hash, force-signs out, and sets sessionStorage so the user lands here with
  // a clean URL. Fall back to the legacy hash check in case AuthContext hasn't
  // run yet (e.g. someone deep-linked into Auth.jsx directly).
  useEffect(() => {
    if (sessionStorage.getItem('bocage_just_confirmed') === '1') {
      setSuccessMessage('Email verified! You can now log in to your account.');
      sessionStorage.removeItem('bocage_just_confirmed');
      return;
    }
    const hash = window.location.hash;
    if (hash && (hash.includes('type=signup') || hash.includes('type=email'))) {
      setSuccessMessage('Email verified! You may now log in.');
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  // Cycle taglines
  useState(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % TAGLINES.length);
    }, 3000);
    return () => clearInterval(interval);
  });

  /**
   * Handles form submission for login, signup, and forgot password.
   * @param {React.FormEvent} e
   */
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error: authError } = await signIn(email, password);
        if (authError) setError(authError.message);
      } else if (mode === 'forgot') {
        // Fire-and-forget — endpoint always returns 200 so we don't leak
        // whether the email is registered. Show the same success copy
        // regardless of whether they're a member or a typo.
        try {
          await fetch(PASSWORD_RESET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
        } catch {
          // network errors are also silenced; UI is intentionally vague
        }
        setSuccessMessage("If we recognize that email, a reset link is on its way. Check your inbox in a minute.");
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }

    setLoading(false);
  }

  /**
   * Switches between auth modes and resets state.
   * @param {'login'|'forgot'} newMode
   */
  function switchMode(newMode) {
    setMode(newMode);
    setError('');
    setSuccessMessage('');
  }

  return (
    <div className="min-h-screen bg-noir-900 flex flex-col items-center justify-center px-6 safe-top safe-bottom relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle radial gradient */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-champagne-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-rose-500/3 rounded-full blur-3xl" />
      </div>

      {/* Branding */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center mb-10 relative z-10"
      >
        {/* Animated logo container */}
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-champagne-500/10 border border-champagne-500/20 mb-5 glow-gold"
        >
          <Wine className="text-champagne-500" size={36} />
        </motion.div>

        <h1 className="font-display text-5xl text-gradient-gold mb-3">Bocage</h1>

        {/* Cycling tagline */}
        <AnimatePresence mode="wait">
          <motion.p
            key={taglineIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="font-serif text-lg text-noir-300"
          >
            {TAGLINES[taglineIndex]}
          </motion.p>
        </AnimatePresence>
      </motion.div>

      {/* Auth form */}
      <AnimatePresence mode="wait">
        <motion.form
          key={mode}
          initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
          transition={{ duration: 0.3 }}
          onSubmit={handleSubmit}
          className="w-full max-w-sm space-y-4 relative z-10"
        >
          {/* Mode title */}
          <div className="text-center mb-2">
            <h2 className="font-display text-xl text-white">
              {mode === 'login' ? 'Welcome Back' : 'Reset Password'}
            </h2>
            <p className="font-sans text-xs text-noir-400 mt-1">
              {mode === 'login' ? 'Sign in to your membership' : 'Enter your email to receive a reset link'}
            </p>
          </div>

          {/* Email field */}
          <div>
            <label className="block text-xs font-sans text-noir-300 mb-1.5 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-noir-800 border border-noir-600 rounded-lg px-4 py-3 text-white font-sans placeholder:text-noir-500 focus:outline-none focus:border-champagne-500 transition-colors"
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          {/* Password field — not shown for forgot mode */}
          {mode !== 'forgot' && (
            <div>
              <label className="block text-xs font-sans text-noir-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-noir-800 border border-noir-600 rounded-lg px-4 py-3 pr-12 text-white font-sans placeholder:text-noir-500 focus:outline-none focus:border-champagne-500 transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-noir-400 hover:text-noir-200 p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Forgot password link — login only */}
          {mode === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-xs font-sans text-noir-400 hover:text-champagne-500 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-rose-500 text-sm font-sans bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2"
            >
              {error}
            </motion.p>
          )}

          {/* Success message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-champagne-500 text-sm font-sans bg-champagne-500/10 border border-champagne-500/20 rounded-lg px-3 py-2"
            >
              <Sparkles size={14} />
              {successMessage}
            </motion.div>
          )}

          {/* Submit button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full bg-champagne-500 text-noir-900 font-sans font-semibold py-3.5 rounded-lg shimmer-gold hover:bg-champagne-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-noir-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'login' ? 'Sign In' : 'Send Reset Link'}
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>

          {/* Mode toggles + invite-only CTA */}
          <div className="text-center space-y-3 pt-2">
            {mode === 'forgot' && (
              <p className="text-noir-300 font-sans text-sm">
                <button type="button" onClick={() => switchMode('login')} className="text-champagne-500 hover:text-champagne-400 font-medium">
                  Back to Sign In
                </button>
              </p>
            )}
            {mode === 'login' && (
              <div className="pt-3 border-t border-noir-700/40 space-y-3">
                <div>
                  <p className="text-noir-400 font-sans text-xs leading-relaxed">
                    Not a member yet? Join the Bocage Champagne Society —
                  </p>
                  <a
                    href={MEMBERSHIP_URL}
                    className="inline-block mt-2 text-champagne-500 hover:text-champagne-400 font-sans text-xs tracking-widest uppercase"
                  >
                    Become a Member &rarr;
                  </a>
                </div>
                <p className="text-noir-500 font-sans text-[11px] leading-relaxed">
                  Questions? <a
                    href={`mailto:${INQUIRE_EMAIL}?subject=${encodeURIComponent(INQUIRE_SUBJECT)}`}
                    className="text-champagne-500 hover:text-champagne-400 underline-offset-2 underline"
                  >Email us</a>.
                </p>
              </div>
            )}
          </div>
        </motion.form>
      </AnimatePresence>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 text-xs text-noir-600 font-sans relative z-10"
      >
        10 Phila St, Saratoga Springs, NY
      </motion.p>
    </div>
  );
}
