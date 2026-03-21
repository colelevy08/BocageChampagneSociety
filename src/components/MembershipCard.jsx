/**
 * @file src/components/MembershipCard.jsx
 * @description Digital membership card component that displays the user's
 * tier, name, member number, and points in a visually rich card format.
 * Features gradient backgrounds, tier-specific theming, and a QR placeholder.
 * @importedBy src/pages/Membership.jsx
 * @imports src/context/AuthContext.jsx, framer-motion, lucide-react
 */

import { motion } from 'framer-motion';
import { Crown, Star, Gem, QrCode } from 'lucide-react';

/** Tier-specific card styling */
const CARD_THEMES = {
  flute: {
    icon: Star,
    gradient: 'from-noir-700 via-noir-600 to-noir-700',
    border: 'border-noir-400/30',
    accent: 'text-noir-200',
    label: 'Flûte',
  },
  magnum: {
    icon: Crown,
    gradient: 'from-champagne-700/40 via-champagne-600/20 to-noir-700',
    border: 'border-champagne-500/30',
    accent: 'text-champagne-400',
    label: 'Magnum',
  },
  jeroboam: {
    icon: Gem,
    gradient: 'from-rose-500/20 via-champagne-700/20 to-noir-700',
    border: 'border-rose-400/30',
    accent: 'text-rose-400',
    label: 'Jeroboam',
  },
};

/**
 * MembershipCard — digital card showing tier, member info, and QR placeholder.
 *
 * @param {object} props
 * @param {string} props.tierSlug - Current tier slug ('flute', 'magnum', 'jeroboam')
 * @param {string} props.memberName - The member's full name
 * @param {string} props.memberId - A display-friendly member ID
 * @param {number} props.points - Current points balance
 * @returns {JSX.Element}
 */
export default function MembershipCard({ tierSlug = 'flute', memberName, memberId, points = 0 }) {
  const theme = CARD_THEMES[tierSlug] || CARD_THEMES.flute;
  const Icon = theme.icon;

  return (
    <motion.div
      initial={{ opacity: 0, rotateY: -10 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-2xl border ${theme.border} bg-gradient-to-br ${theme.gradient} p-5 shadow-xl`}
      style={{ perspective: 1000 }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-champagne-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

      {/* Header row */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <Icon className={theme.accent} size={20} />
          <span className={`font-display text-lg ${theme.accent}`}>{theme.label}</span>
        </div>
        <span className="font-display text-sm text-gradient-gold">BOCAGE</span>
      </div>

      {/* QR code placeholder */}
      <div className="flex items-end justify-between relative z-10">
        <div>
          {/* Member name */}
          <p className="font-display text-xl text-white mb-1">
            {memberName || 'Member'}
          </p>
          {/* Member ID */}
          <p className="font-sans text-xs text-noir-400 tracking-wider mb-3">
            {memberId || '••••  ••••  ••••'}
          </p>
          {/* Points */}
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-2xl text-white">{points.toLocaleString()}</span>
            <span className="font-sans text-xs text-noir-400">pts</span>
          </div>
        </div>

        {/* QR code area */}
        <div className="w-16 h-16 bg-white/10 rounded-lg border border-white/10 flex items-center justify-center">
          <QrCode className="text-white/40" size={28} />
        </div>
      </div>

      {/* Bottom stripe */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-champagne-500/40 to-transparent" />
    </motion.div>
  );
}
