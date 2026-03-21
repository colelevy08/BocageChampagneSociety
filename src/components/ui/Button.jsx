/**
 * @file src/components/ui/Button.jsx
 * @description Reusable button component with multiple variants, sizes,
 * loading states, and icon support. Matches the luxury design system.
 * @importedBy All page components in src/pages/
 */

import { motion } from 'framer-motion';

/** Variant class maps */
const VARIANTS = {
  primary: 'bg-champagne-500 text-noir-900 font-semibold shimmer-gold hover:bg-champagne-400',
  secondary: 'bg-noir-800 text-noir-200 border border-noir-700 hover:border-champagne-600 hover:text-white',
  ghost: 'text-noir-300 hover:text-white hover:bg-noir-800',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20',
  gold: 'bg-gradient-to-r from-champagne-600 to-champagne-400 text-noir-900 font-semibold',
};

/** Size class maps */
const SIZES = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2.5',
  lg: 'text-base px-6 py-3.5',
  full: 'text-sm px-4 py-3.5 w-full',
};

/**
 * Button — styled button with loading state and icon support.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Button label
 * @param {'primary'|'secondary'|'ghost'|'danger'|'gold'} props.variant
 * @param {'sm'|'md'|'lg'|'full'} props.size
 * @param {boolean} props.loading - Shows spinner and disables interaction
 * @param {React.ReactNode} props.icon - Optional left icon
 * @param {string} props.className - Additional classes
 * @param {object} props.rest - Passed to the button element
 * @returns {JSX.Element}
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  ...rest
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      disabled={loading || rest.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-sans transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        icon
      ) : null}
      {children}
    </motion.button>
  );
}
