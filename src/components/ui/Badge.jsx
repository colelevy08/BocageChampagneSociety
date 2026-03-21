/**
 * @file src/components/ui/Badge.jsx
 * @description Badge component for labels, tier indicators, and status tags.
 * Supports multiple color variants matching the design system.
 * @importedBy src/pages/Menu.jsx, Events.jsx, Membership.jsx, AdminInventory.jsx
 */

/** Color variant class maps */
const VARIANTS = {
  gold: 'bg-champagne-500/20 text-champagne-400 border-champagne-500/30',
  rose: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  gray: 'bg-noir-600/50 text-noir-300 border-noir-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

/**
 * Badge — small label for categories, statuses, and tier indicators.
 *
 * @param {object} props
 * @param {string} props.children - Badge text
 * @param {'gold'|'rose'|'green'|'red'|'gray'|'blue'} props.variant - Color variant
 * @param {'sm'|'md'} props.size - Size variant (default 'sm')
 * @param {boolean} props.dot - Show a colored dot before the text
 * @returns {JSX.Element}
 */
export default function Badge({ children, variant = 'gold', size = 'sm', dot = false }) {
  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1 font-sans rounded-full border ${VARIANTS[variant]} ${sizeClasses}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${variant === 'gold' ? 'bg-champagne-500' : variant === 'green' ? 'bg-emerald-500' : variant === 'red' ? 'bg-red-500' : 'bg-noir-400'}`} />
      )}
      {children}
    </span>
  );
}
