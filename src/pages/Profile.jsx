/**
 * @file src/pages/Profile.jsx
 * @description User profile page for Bocage Champagne Society.
 * Shows the user's name, email, membership tier badge, and provides
 * sign out functionality. Links to Bocage social/contact info.
 * @importedBy src/App.jsx (route: /profile)
 * @imports src/context/AuthContext.jsx, framer-motion, lucide-react
 */

import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Crown,
  LogOut,
  ExternalLink,
  MapPin,
  Phone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Profile page component — displays user info and settings.
 *
 * @returns {JSX.Element}
 */
export default function Profile() {
  const { user, profile, tier, signOut } = useAuth();

  /**
   * Handles sign out with confirmation.
   */
  async function handleSignOut() {
    await signOut();
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl text-gradient-gold">Profile</h1>
      </div>

      {/* User card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 mb-6"
      >
        {/* Avatar placeholder + name */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-champagne-500/10 flex items-center justify-center">
            <User className="text-champagne-500" size={28} />
          </div>
          <div>
            <h2 className="font-display text-xl text-white">
              {profile?.full_name || 'Member'}
            </h2>
            <div className="flex items-center gap-1 text-noir-400 text-sm font-sans mt-0.5">
              <Mail size={14} />
              {user?.email}
            </div>
          </div>
        </div>

        {/* Tier badge */}
        {tier && (
          <div className="flex items-center gap-2 bg-noir-800 rounded-lg px-4 py-2.5">
            <Crown className="text-champagne-500" size={18} />
            <span className="font-sans text-sm text-white">{tier.name} Member</span>
            <span className="ml-auto font-sans text-xs text-noir-400">
              {tier.points_multiplier}x points
            </span>
          </div>
        )}
      </motion.div>

      {/* Contact info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-5 mb-6"
      >
        <h3 className="font-display text-lg text-white mb-3">Bocage Champagne Bar</h3>
        <div className="space-y-2.5">
          <div className="flex items-center gap-3 text-sm font-sans text-noir-300">
            <MapPin size={16} className="text-champagne-600 flex-shrink-0" />
            10 Phila St, Saratoga Springs, NY 12866
          </div>
          <div className="flex items-center gap-3 text-sm font-sans text-noir-300">
            <Mail size={16} className="text-champagne-600 flex-shrink-0" />
            Zac@SureThingHospitality.com
          </div>
        </div>
      </motion.div>

      {/* Sign out */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 bg-noir-800 border border-noir-700 text-noir-200 font-sans py-3.5 rounded-xl hover:border-rose-500/50 hover:text-rose-400 transition-colors"
      >
        <LogOut size={18} />
        Sign Out
      </motion.button>

      {/* App version */}
      <p className="text-center text-xs text-noir-600 font-sans mt-6">
        Bocage Society v1.0.0
      </p>
    </div>
  );
}
