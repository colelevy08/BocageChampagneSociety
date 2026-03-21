/**
 * @file src/pages/Auth.jsx
 * @description Login and signup screen for Bocage Champagne Society.
 * Shown when no authenticated session exists. Features Bocage branding,
 * email/password auth, and toggle between login and signup modes.
 * @importedBy src/App.jsx (rendered when user is not authenticated)
 * @imports src/context/AuthContext.jsx, framer-motion, lucide-react
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wine, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Auth page component — handles both login and signup flows.
 * Displays the Bocage branding at the top, an email/password form,
 * and a toggle to switch between modes.
 *
 * @returns {JSX.Element}
 */
export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  /**
   * Handles form submission for both login and signup.
   * Displays errors inline if auth fails.
   * @param {React.FormEvent} e
   */
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error: authError } = await signIn(email, password);
        if (authError) setError(authError.message);
      } else {
        if (!fullName.trim()) {
          setError('Please enter your full name.');
          setLoading(false);
          return;
        }
        const { error: authError } = await signUp(email, password, fullName);
        if (authError) {
          setError(authError.message);
        } else {
          setSuccessMessage('Check your email to confirm your account.');
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-noir-900 flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      {/* Branding */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-champagne-500/10 mb-4">
          <Wine className="text-champagne-500" size={32} />
        </div>
        <h1 className="font-display text-4xl text-gradient-gold mb-2">Bocage</h1>
        <p className="font-serif text-lg text-noir-300">Champagne Society</p>
      </motion.div>

      {/* Auth form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4"
      >
        {/* Full name field — signup only */}
        {!isLogin && (
          <div>
            <label className="block text-xs font-sans text-noir-300 mb-1.5 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-noir-800 border border-noir-600 rounded-lg px-4 py-3 text-white font-sans placeholder:text-noir-400 focus:outline-none focus:border-champagne-500 transition-colors"
              placeholder="Your full name"
            />
          </div>
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
            className="w-full bg-noir-800 border border-noir-600 rounded-lg px-4 py-3 text-white font-sans placeholder:text-noir-400 focus:outline-none focus:border-champagne-500 transition-colors"
            placeholder="your@email.com"
            required
          />
        </div>

        {/* Password field */}
        <div>
          <label className="block text-xs font-sans text-noir-300 mb-1.5 uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-noir-800 border border-noir-600 rounded-lg px-4 py-3 pr-12 text-white font-sans placeholder:text-noir-400 focus:outline-none focus:border-champagne-500 transition-colors"
              placeholder="••••••••"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-noir-400 hover:text-noir-200"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-rose-500 text-sm font-sans">{error}</p>
        )}

        {/* Success message (signup confirmation) */}
        {successMessage && (
          <p className="text-champagne-500 text-sm font-sans">{successMessage}</p>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-champagne-500 text-noir-900 font-sans font-semibold py-3.5 rounded-lg shimmer-gold hover:bg-champagne-400 transition-colors disabled:opacity-50"
        >
          {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
        </button>

        {/* Toggle login/signup */}
        <p className="text-center text-noir-300 font-sans text-sm">
          {isLogin ? "Don't have an account?" : 'Already a member?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccessMessage('');
            }}
            className="text-champagne-500 hover:text-champagne-400 underline"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </motion.form>

      {/* Footer */}
      <p className="mt-12 text-xs text-noir-500 font-sans">
        10 Phila St, Saratoga Springs, NY
      </p>
    </div>
  );
}
