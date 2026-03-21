/**
 * @file src/components/ui/EmptyState.jsx
 * @description Reusable empty state component with icon, message, and optional action.
 * Used when lists have no items (no wines, no events, etc.).
 * @importedBy src/pages/Menu.jsx, Events.jsx, AdminInventory.jsx
 * @imports framer-motion
 */

import { motion } from 'framer-motion';

/**
 * EmptyState — centered placeholder for empty lists/screens.
 *
 * @param {object} props
 * @param {React.ReactNode} props.icon - Lucide icon component (already rendered)
 * @param {string} props.title - Primary message
 * @param {string} props.description - Secondary helper text
 * @param {React.ReactNode} props.action - Optional action button
 * @returns {JSX.Element}
 */
export default function EmptyState({ icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-20 px-4"
    >
      {icon && (
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-noir-800 mb-4">
          {icon}
        </div>
      )}
      <p className="font-display text-lg text-noir-300">{title}</p>
      {description && (
        <p className="font-sans text-sm text-noir-500 mt-1.5 max-w-xs mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
