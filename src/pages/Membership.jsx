/**
 * @file src/pages/Membership.jsx
 * @description Membership page showing the user's current tier, points balance,
 * progress toward the next tier, and benefits for all three tiers
 * (Flûte, Magnum, Jeroboam).
 * @importedBy src/App.jsx (route: /membership)
 * @imports src/context/AuthContext.jsx, src/lib/supabase.js, framer-motion, lucide-react
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Gem, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

/** Tier display config — icons, colors, and benefits for each membership level */
const TIER_CONFIG = {
  flute: {
    icon: Star,
    color: 'text-noir-200',
    bgColor: 'bg-noir-200/10',
    borderColor: 'border-noir-400/30',
    label: 'Flûte',
    benefits: [
      'Earn 1x points on every visit',
      'Access to member-only events',
      'Birthday champagne toast',
      'Early access to new arrivals',
    ],
  },
  magnum: {
    icon: Crown,
    color: 'text-champagne-500',
    bgColor: 'bg-champagne-500/10',
    borderColor: 'border-champagne-500/30',
    label: 'Magnum',
    benefits: [
      'Earn 1.5x points on every visit',
      'All Flûte benefits',
      'Complimentary glass monthly',
      'Priority event seating',
      'Exclusive Magnum tastings',
    ],
  },
  jeroboam: {
    icon: Gem,
    color: 'text-rose-400',
    bgColor: 'bg-rose-400/10',
    borderColor: 'border-rose-400/30',
    label: 'Jeroboam',
    benefits: [
      'Earn 2x points on every visit',
      'All Magnum benefits',
      'Complimentary bottle monthly',
      'Private lounge access',
      'Personal sommelier service',
      'At-Home experience discount',
    ],
  },
};

/**
 * Membership page component — displays tier card, points progress, and tier benefits.
 *
 * @returns {JSX.Element}
 */
export default function Membership() {
  const { membership, tier } = useAuth();
  const [tiers, setTiers] = useState([]);

  // Fetch all membership tiers for the benefits comparison
  useEffect(() => {
    async function fetchTiers() {
      const { data } = await supabase
        .from('membership_tiers')
        .select('*')
        .order('sort_order');
      if (data) setTiers(data);
    }
    fetchTiers();
  }, []);

  const currentSlug = tier?.slug || 'flute';
  const currentConfig = TIER_CONFIG[currentSlug] || TIER_CONFIG.flute;
  const CurrentIcon = currentConfig.icon;
  const points = membership?.points || 0;

  // Calculate progress to next tier
  const tierOrder = ['flute', 'magnum', 'jeroboam'];
  const currentIndex = tierOrder.indexOf(currentSlug);
  const nextTier = currentIndex < 2 ? tiers.find((t) => t.slug === tierOrder[currentIndex + 1]) : null;
  const prevThreshold = tier?.points_required || 0;
  const nextThreshold = nextTier?.points_required || points;
  const progress = nextTier
    ? Math.min(((points - prevThreshold) / (nextThreshold - prevThreshold)) * 100, 100)
    : 100;

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl text-gradient-gold">Society</h1>
        <p className="font-serif text-noir-300 mt-1">Your Membership</p>
      </div>

      {/* Current tier card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`glass rounded-2xl p-6 mb-6 border ${currentConfig.borderColor}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full ${currentConfig.bgColor} flex items-center justify-center`}>
            <CurrentIcon className={currentConfig.color} size={24} />
          </div>
          <div>
            <p className="font-sans text-xs text-noir-400 uppercase tracking-wider">Current Tier</p>
            <h2 className={`font-display text-2xl ${currentConfig.color}`}>
              {currentConfig.label}
            </h2>
          </div>
        </div>

        {/* Points display */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl text-white">{points.toLocaleString()}</span>
            <span className="font-sans text-sm text-noir-400">points</span>
          </div>
        </div>

        {/* Progress bar to next tier */}
        {nextTier && (
          <div>
            <div className="flex justify-between text-xs font-sans text-noir-400 mb-1.5">
              <span>{currentConfig.label}</span>
              <span>{TIER_CONFIG[nextTier.slug]?.label || nextTier.name}</span>
            </div>
            <div className="h-2 bg-noir-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-champagne-600 to-champagne-400 rounded-full"
              />
            </div>
            <p className="text-xs font-sans text-noir-400 mt-1.5">
              {nextThreshold - points} points to {TIER_CONFIG[nextTier.slug]?.label || nextTier.name}
            </p>
          </div>
        )}

        {/* Max tier reached */}
        {!nextTier && (
          <p className="text-sm font-serif text-champagne-400">
            You've reached the highest tier. Welcome to the inner circle.
          </p>
        )}
      </motion.div>

      {/* All tier benefits */}
      <h3 className="font-display text-xl text-white mb-4">Tier Benefits</h3>
      <div className="space-y-4">
        {tierOrder.map((slug, index) => {
          const config = TIER_CONFIG[slug];
          const Icon = config.icon;
          const isCurrentOrAbove = tierOrder.indexOf(currentSlug) >= index;

          return (
            <motion.div
              key={slug}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass rounded-xl p-4 border ${
                slug === currentSlug ? config.borderColor : 'border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <Icon className={config.color} size={20} />
                <h4 className={`font-display text-lg ${config.color}`}>{config.label}</h4>
                {slug === currentSlug && (
                  <span className="ml-auto text-xs font-sans bg-champagne-500/20 text-champagne-400 px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </div>
              <ul className="space-y-1.5">
                {config.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 text-sm font-serif text-noir-200">
                    <ChevronRight className="text-champagne-600 flex-shrink-0 mt-0.5" size={14} />
                    {benefit}
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
