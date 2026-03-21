/**
 * @file src/components/ui/Toast.jsx
 * @description Toast notification system for Bocage Champagne Society.
 * Provides a context-based toast system with success, error, info, and warning variants.
 * Toasts auto-dismiss with smooth exit animations.
 * @importedBy src/App.jsx (wraps app), any component via useToast()
 * @imports framer-motion, lucide-react
 */

import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

/**
 * Hook to access the toast notification system from any component.
 * @returns {{ success: Function, error: Function, info: Function, warning: Function }}
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

/** Toast variant styling and icons */
const VARIANTS = {
  success: {
    icon: CheckCircle,
    className: 'border-champagne-500/30 bg-champagne-500/10',
    iconColor: 'text-champagne-500',
  },
  error: {
    icon: XCircle,
    className: 'border-rose-500/30 bg-rose-500/10',
    iconColor: 'text-rose-500',
  },
  info: {
    icon: Info,
    className: 'border-blue-400/30 bg-blue-400/10',
    iconColor: 'text-blue-400',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-amber-400/30 bg-amber-400/10',
    iconColor: 'text-amber-400',
  },
};

/**
 * ToastProvider — wraps the app and provides toast notification methods.
 * Renders toast stack in a fixed position at the top of the screen.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  /**
   * Adds a toast notification to the stack.
   * @param {string} message - Text to display
   * @param {'success'|'error'|'info'|'warning'} variant - Toast type
   * @param {number} duration - Auto-dismiss time in ms (default 3500)
   */
  const addToast = useCallback((message, variant = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  /** Remove a specific toast by ID */
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast stack */}
      <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none safe-top px-4 pt-2">
        <AnimatePresence>
          {toasts.map((toast) => {
            const config = VARIANTS[toast.variant] || VARIANTS.info;
            const Icon = config.icon;
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`pointer-events-auto mb-2 flex items-center gap-3 rounded-xl border backdrop-blur-xl px-4 py-3 shadow-lg ${config.className}`}
              >
                <Icon size={18} className={config.iconColor} />
                <p className="flex-1 font-sans text-sm text-white">{toast.message}</p>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-noir-400 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
