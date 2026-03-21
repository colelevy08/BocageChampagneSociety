/**
 * @file src/components/ui/Modal.jsx
 * @description Reusable modal component with backdrop blur, animations, and
 * multiple size variants. Handles focus trap, escape key, and backdrop click.
 * @importedBy src/pages/Menu.jsx (wine detail), AdminInventory.jsx (edit form), Events.jsx
 * @imports framer-motion
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Modal component — animated overlay with content panel.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Called when modal should close
 * @param {string} props.title - Modal header title
 * @param {React.ReactNode} props.children - Modal body content
 * @param {'sm'|'md'|'lg'|'full'} props.size - Width variant (default 'md')
 * @param {boolean} props.showClose - Whether to show the X button (default true)
 * @returns {JSX.Element}
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
}) {
  const panelRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    full: 'max-w-full mx-2',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-noir-900/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel — slides up on mobile, scales in on desktop */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className={`relative w-full ${sizeClasses[size]} glass rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto z-10`}
          >
            {/* Header */}
            {(title || showClose) && (
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 pt-5 pb-3 bg-noir-800/90 backdrop-blur-sm rounded-t-2xl">
                {/* Drag handle on mobile */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-noir-600 sm:hidden" />
                <h2 className="font-display text-lg text-white">{title}</h2>
                {showClose && (
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-noir-400 hover:text-white hover:bg-noir-700 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="px-5 pb-5">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
