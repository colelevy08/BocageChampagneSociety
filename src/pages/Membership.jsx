/**
 * @file src/pages/Membership.jsx
 * @description Society membership page — single-product view.
 * Shows the member's status card (welcome, member-since), the curated list of
 * member benefits, and a contact CTA. There are no tiers and no points system.
 * @importedBy src/App.jsx (route: /membership)
 * @imports src/context/AuthContext.jsx, src/components/ui/*, src/hooks/usePullToRefresh.js,
 *          framer-motion, lucide-react, date-fns
 */

import { motion } from 'framer-motion';
import { Crown, Mail, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useSocietyContent, iconForName } from '../lib/societyContent';

/**
 * Membership page component — status card, benefits list, and contact CTA.
 * @returns {JSX.Element}
 */
export default function Membership() {
  const { membership, profile, user } = useAuth();
  const { benefits } = useSocietyContent();

  // Pull-to-refresh just re-pulls the auth context's underlying data via reload.
  // Membership state is sparse here, so a no-op refresh keeps the gesture feeling alive.
  const { isRefreshing, pullDistance } = usePullToRefresh(async () => {
    // Intentionally light — single-product membership has no list to refetch.
    return Promise.resolve();
  });

  const memberSince = membership?.joined_at
    ? format(new Date(membership.joined_at), 'MMMM yyyy')
    : 'Just joined';

  const firstName = (profile?.full_name || '').trim().split(' ')[0];

  return (
    <div className="px-4 pt-6 pb-4">
      {pullDistance > 0 && (
        <div className="flex justify-center -mt-4 mb-2">
          <RefreshCw size={20} className={`text-champagne-500 ${isRefreshing ? 'animate-spin' : ''}`} />
        </div>
      )}

      <PageHeader title="Society" subtitle="Your Membership" />

      {/* Status card — the headline element on the page */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-6 mb-6 border border-champagne-500/30 glow-gold"
      >
        <div className="flex items-center gap-3 mb-5">
          <motion.div
            animate={{ rotate: [0, 6, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-14 h-14 rounded-full bg-champagne-500/10 flex items-center justify-center"
          >
            <Crown className="text-champagne-500" size={26} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="font-sans text-xs text-noir-400 uppercase tracking-wider">Member</p>
            <h2 className="font-display text-2xl text-gradient-gold truncate">
              {firstName || 'Welcome'}
            </h2>
          </div>
          <Badge variant="gold" size="sm">Active</Badge>
        </div>

        {/* Welcome line + member-since */}
        <p className="font-serif text-base text-noir-200 leading-relaxed mb-4">
          Welcome to the Bocage Champagne Society — our private circle for the people
          who care most about what's in the glass.
        </p>

        <div className="flex items-center justify-between bg-noir-800 rounded-xl px-4 py-3">
          <div>
            <p className="font-sans text-[10px] text-noir-500 uppercase tracking-wider">Member Since</p>
            <p className="font-display text-base text-white mt-0.5">{memberSince}</p>
          </div>
          {user?.email && (
            <div className="text-right">
              <p className="font-sans text-[10px] text-noir-500 uppercase tracking-wider">Account</p>
              <p className="font-sans text-xs text-noir-300 mt-0.5 truncate max-w-[160px]">
                {user.email}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Member benefits */}
      <h3 className="font-display text-xl text-white mb-4">What's Included</h3>
      <div className="space-y-3 mb-8">
        {benefits.map(({ icon, title, body }, i) => {
          const Icon = iconForName(icon);
          return (
            <motion.div
              key={title + i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="glass rounded-xl p-4 flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-champagne-500/10 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-champagne-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-display text-base text-white">{title}</h4>
                <p className="font-serif text-sm text-noir-300 mt-0.5 leading-relaxed">{body}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Contact CTA — for questions about the Society */}
      <motion.a
        href="mailto:Zac@SureThingHospitality.com?subject=Bocage%20Champagne%20Society"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass rounded-2xl p-5 flex items-center gap-4 hover-lift"
      >
        <div className="w-12 h-12 rounded-full bg-champagne-500/10 flex items-center justify-center flex-shrink-0">
          <Mail size={20} className="text-champagne-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-base text-white">Questions? Reach the team.</p>
          <p className="font-serif text-sm text-noir-400 mt-0.5">
            Anything about your membership, events, or pours — write us directly.
          </p>
        </div>
      </motion.a>
    </div>
  );
}
