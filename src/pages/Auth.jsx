/**
 * @file src/pages/Auth.jsx
 * @description Login and signup screen for Bocage Champagne Society.
 * Features Bocage branding with animated logo, email/password auth,
 * password strength indicator, terms acceptance, and smooth mode transitions.
 * @importedBy src/App.jsx (rendered when user is not authenticated)
 * @imports src/context/AuthContext.jsx, src/components/ui/PasswordStrength.jsx,
 *          src/components/ui/Input.jsx, src/components/ui/Button.jsx, framer-motion, lucide-react
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wine, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PasswordStrength from '../components/ui/PasswordStrength';

/** Taglines that cycle in the header */
const TAGLINES = [
  'Champagne Society',
  'Saratoga Springs, NY',
  'Established 2021',
];

/**
 * Auth page component — handles login, signup, and forgot password flows.
 * Features animated background particles, password strength meter,
 * and staggered form entrance animations.
 *
 * @returns {JSX.Element}
 */
export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [taglineIndex, setTaglineIndex] = useState(0);

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
      } else if (mode === 'signup') {
        if (!fullName.trim()) {
          setError('Please enter your full name.');
          setLoading(false);
          return;
        }
        if (!acceptedTerms) {
          setError('Please accept the terms to continue.');
          setLoading(false);
          return;
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters.');
          setLoading(false);
          return;
        }
        const { error: authError } = await signUp(email, password, fullName);
        if (authError) {
          setError(authError.message);
        } else {
          setSuccessMessage('Account created! Check your email to verify.');
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }

    setLoading(false);
  }

  /**
   * Switches between auth modes and resets state.
   * @param {'login'|'signup'|'forgot'} newMode
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

        <h1 className="font-display text-5xl text-gradient-gold mb-1">Bocage</h1>
        <p className="font-sans text-xs text-noir-400 uppercase tracking-[0.3em] mb-3">Champagne Bar</p>

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
              {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Join the Society' : 'Reset Password'}
            </h2>
            <p className="font-sans text-xs text-noir-400 mt-1">
              {mode === 'login'
                ? 'Sign in to your membership'
                : mode === 'signup'
                ? 'Create your exclusive membership'
                : 'Enter your email to receive a reset link'}
            </p>
          </div>

          {/* Full name field — signup only */}
          {mode === 'signup' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className="block text-xs font-sans text-noir-300 mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-noir-800 border border-noir-600 rounded-lg px-4 py-3 text-white font-sans placeholder:text-noir-500 focus:outline-none focus:border-champagne-500 transition-colors"
                placeholder="Your full name"
                autoComplete="name"
              />
            </motion.div>
          )}

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
                  placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'}
                  required
                  minLength={mode === 'signup' ? 8 : 6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-noir-400 hover:text-noir-200 p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password strength — signup only */}
              {mode === 'signup' && <PasswordStrength password={password} />}
            </div>
          )}

          {/* Terms checkbox — signup only */}
          {mode === 'signup' && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 accent-champagne-500 w-4 h-4"
              />
              <span className="text-xs font-sans text-noir-400 leading-relaxed">
                I agree to the membership terms and privacy policy of Bocage Champagne Society
              </span>
            </label>
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
                {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>

          {/* Mode toggles */}
          <div className="text-center space-y-2">
            {mode === 'login' && (
              <p className="text-noir-300 font-sans text-sm">
                Not a member yet?{' '}
                <button type="button" onClick={() => switchMode('signup')} className="text-champagne-500 hover:text-champagne-400 font-medium">
                  Join Now
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p className="text-noir-300 font-sans text-sm">
                Already a member?{' '}
                <button type="button" onClick={() => switchMode('login')} className="text-champagne-500 hover:text-champagne-400 font-medium">
                  Sign In
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <p className="text-noir-300 font-sans text-sm">
                <button type="button" onClick={() => switchMode('login')} className="text-champagne-500 hover:text-champagne-400 font-medium">
                  Back to Sign In
                </button>
              </p>
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
