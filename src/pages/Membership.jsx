/**
 * @file src/pages/Membership.jsx
 * @description Membership page showing the user's current tier, animated points balance,
 * progress toward the next tier, benefits comparison, and recent point transaction history.
 * @importedBy src/App.jsx (route: /membership)
 * @imports src/context/AuthContext.jsx, src/lib/supabase.js, src/components/ui/*,
 *          src/hooks/usePullToRefresh.js, framer-motion, lucide-react, date-fns
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Star, Gem, ChevronRight, History, TrendingUp, Gift, RefreshCw, Award } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

/** Tier display config */
const TIER_CONFIG = {
  flute: {
    icon: Star,
    color: 'text-noir-200',
    bgColor: 'bg-noir-200/10',
    borderColor: 'border-noir-400/30',
    gradientFrom: 'from-noir-400',
    gradientTo: 'to-noir-200',
    label: 'Flûte',
    benefits: [
      { text: 'Earn 1x points on every visit', icon: TrendingUp },
      { text: 'Access to member-only events', icon: Star },
      { text: 'Birthday champagne toast', icon: Gift },
      { text: 'Early access to new arrivals', icon: Award },
    ],
  },
  magnum: {
    icon: Crown,
    color: 'text-champagne-500',
    bgColor: 'bg-champagne-500/10',
    borderColor: 'border-champagne-500/30',
    gradientFrom: 'from-champagne-600',
    gradientTo: 'to-champagne-400',
    label: 'Magnum',
    benefits: [
      { text: 'Earn 1.5x points on every visit', icon: TrendingUp },
      { text: 'All Flûte benefits included', icon: Star },
      { text: 'Complimentary glass monthly', icon: Gift },
      { text: 'Priority event seating', icon: Award },
      { text: 'Exclusive Magnum tastings', icon: Crown },
    ],
  },
  jeroboam: {
    icon: Gem,
    color: 'text-rose-400',
    bgColor: 'bg-rose-400/10',
    borderColor: 'border-rose-400/30',
    gradientFrom: 'from-rose-500',
    gradientTo: 'to-rose-300',
    label: 'Jeroboam',
    benefits: [
      { text: 'Earn 2x points on every visit', icon: TrendingUp },
      { text: 'All Magnum benefits included', icon: Crown },
      { text: 'Complimentary bottle monthly', icon: Gift },
      { text: 'Private lounge access', icon: Award },
      { text: 'Personal sommelier service', icon: Gem },
      { text: 'At-Home experience discount', icon: Star },
    ],
  },
};

/**
 * Membership page component — tier card, points progress, transaction history, tier benefits.
 * @returns {JSX.Element}
 */
export default function Membership() {
  const { membership, tier, user } = useAuth();
  const [tiers, setTiers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const fetchData = useCallback(async () => {
    const [tiersRes, txRes] = await Promise.all([
      supabase.from('membership_tiers').select('*').order('sort_order'),
      user
        ? supabase.from('point_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
        : Promise.resolve({ data: [] }),
    ]);
    if (tiersRes.data) setTiers(tiersRes.data);
    if (txRes.data) setTransactions(txRes.data);
  }, [user]);

  const { isRefreshing, pullDistance } = usePullToRefresh(fetchData);

  useEffect(() => { fetchData(); }, [fetchData]);

  const currentSlug = tier?.slug || 'flute';
  const currentConfig = TIER_CONFIG[currentSlug] || TIER_CONFIG.flute;
  const CurrentIcon = currentConfig.icon;
  const points = membership?.points || 0;

  // Progress calculation
  const tierOrder = ['flute', 'magnum', 'jeroboam'];
  const currentIndex = tierOrder.indexOf(currentSlug);
  const nextTier = currentIndex < 2 ? tiers.find((t) => t.slug === tierOrder[currentIndex + 1]) : null;
  const prevThreshold = tier?.points_required || 0;
  const nextThreshold = nextTier?.points_required || points;
  const progress = nextTier
    ? Math.min(((points - prevThreshold) / (nextThreshold - prevThreshold)) * 100, 100)
    : 100;

  /** Source label + color mapping for transaction history */
  const sourceConfig = {
    visit: { label: 'Visit', variant: 'gold' },
    event: { label: 'Event', variant: 'blue' },
    purchase: { label: 'Purchase', variant: 'green' },
    bonus: { label: 'Bonus', variant: 'rose' },
    redemption: { label: 'Redeemed', variant: 'red' },
  };

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div className="flex justify-center -mt-4 mb-2">
          <RefreshCw size={20} className={`text-champagne-500 ${isRefreshing ? 'animate-spin' : ''}`} />
        </div>
      )}

      <PageHeader title="Society" subtitle="Your Membership" />

      {/* Current tier card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`glass rounded-2xl p-6 mb-4 border ${currentConfig.borderColor} glow-gold`}
      >
        <div className="flex items-center gap-3 mb-5">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className={`w-14 h-14 rounded-full ${currentConfig.bgColor} flex items-center justify-center`}
          >
            <CurrentIcon className={currentConfig.color} size={26} />
          </motion.div>
          <div>
            <p className="font-sans text-xs text-noir-400 uppercase tracking-wider">Current Tier</p>
            <h2 className={`font-display text-2xl ${currentConfig.color}`}>{currentConfig.label}</h2>
          </div>
          <div className="ml-auto text-right">
            <p className="font-sans text-xs text-noir-400">Multiplier</p>
            <p className={`font-display text-lg ${currentConfig.color}`}>
              {tier?.points_multiplier || 1}x
            </p>
          </div>
        </div>

        {/* Animated points display */}
        <div className="text-center mb-5">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <span className="font-display text-5xl text-white">{points.toLocaleString()}</span>
            <span className="font-sans text-sm text-noir-400 ml-2">points</span>
          </motion.div>
        </div>

        {/* Progress bar to next tier */}
        {nextTier ? (
          <div>
            <div className="flex justify-between text-xs font-sans text-noir-400 mb-2">
              <span>{currentConfig.label}</span>
              <span>{TIER_CONFIG[nextTier.slug]?.label || nextTier.name}</span>
            </div>
            <div className="h-3 bg-noir-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                className={`h-full bg-gradient-to-r ${currentConfig.gradientFrom} ${currentConfig.gradientTo} rounded-full relative`}
              >
                {/* Animated glow on the progress tip */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white/30 blur-sm" />
              </motion.div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs font-sans text-noir-400">
                {Math.round(progress)}% complete
              </p>
              <p className="text-xs font-sans text-champagne-400">
                {(nextThreshold - points).toLocaleString()} pts to go
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center bg-noir-800 rounded-xl p-3">
            <p className="text-sm font-serif text-champagne-400">
              You've reached the highest tier. Welcome to the inner circle.
            </p>
          </div>
        )}
      </motion.div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Member Since', value: membership?.joined_at ? format(new Date(membership.joined_at), 'MMM yyyy') : '—' },
          { label: 'Total Earned', value: transactions.filter(t => t.points > 0).reduce((s, t) => s + t.points, 0).toLocaleString() },
          { label: 'Transactions', value: transactions.length.toString() },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="glass rounded-xl p-3 text-center"
          >
            <p className="font-sans text-xs text-noir-400">{stat.label}</p>
            <p className="font-display text-lg text-white mt-0.5">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Transaction history toggle */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setShowHistory(!showHistory)}
        className="w-full flex items-center justify-between glass rounded-xl p-4 mb-6"
      >
        <div className="flex items-center gap-2">
          <History size={18} className="text-champagne-500" />
          <span className="font-sans text-sm text-white">Point History</span>
        </div>
        <ChevronRight
          size={16}
          className={`text-noir-400 transition-transform ${showHistory ? 'rotate-90' : ''}`}
        />
      </motion.button>

      {/* Transaction history list */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            {transactions.length === 0 ? (
              <p className="text-center font-serif text-noir-400 py-6">
                No transactions yet. Visit Bocage to start earning!
              </p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx, i) => {
                  const config = sourceConfig[tx.source] || sourceConfig.visit;
                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 bg-noir-800 rounded-lg px-3 py-2.5"
                    >
                      <Badge variant={config.variant} size="sm">{config.label}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-sm text-white truncate">{tx.description || 'Points update'}</p>
                        <p className="font-sans text-xs text-noir-500">
                          {format(new Date(tx.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <span className={`font-sans text-sm font-medium ${tx.points > 0 ? 'text-champagne-500' : 'text-rose-400'}`}>
                        {tx.points > 0 ? '+' : ''}{tx.points}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tier benefits */}
      <h3 className="font-display text-xl text-white mb-4">Tier Benefits</h3>
      <div className="space-y-4">
        {tierOrder.map((slug, index) => {
          const config = TIER_CONFIG[slug];
          const Icon = config.icon;

          return (
            <motion.div
              key={slug}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className={`glass rounded-xl p-4 border transition-all ${
                slug === currentSlug ? `${config.borderColor} glow-gold` : 'border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <Icon className={config.color} size={20} />
                <h4 className={`font-display text-lg ${config.color}`}>{config.label}</h4>
                {slug === currentSlug && (
                  <Badge variant="gold" size="sm">Current</Badge>
                )}
              </div>
              <ul className="space-y-2">
                {config.benefits.map(({ text, icon: BenefitIcon }) => (
                  <li key={text} className="flex items-start gap-2.5 text-sm font-serif text-noir-200">
                    <BenefitIcon className="text-champagne-600 flex-shrink-0 mt-0.5" size={14} />
                    {text}
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
