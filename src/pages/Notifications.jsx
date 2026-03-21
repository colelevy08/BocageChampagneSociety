/**
 * @file src/pages/Notifications.jsx
 * @description Notification center/inbox page for Bocage Champagne Society.
 * Displays a chronological list of app notifications including point awards,
 * booking confirmations, tier upgrades, and system messages.
 * Currently renders placeholder UI since push notification history would
 * require a dedicated Supabase table in a future migration.
 * @importedBy src/App.jsx (route: /notifications)
 * @imports framer-motion, lucide-react, src/components/ui/*
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Crown, CalendarDays, Sparkles, Gift, Star, Check, Trash2 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';

/** Sample notification types with icons and colors */
const NOTIF_TYPES = {
  points: { icon: Star, variant: 'gold', label: 'Points' },
  booking: { icon: CalendarDays, variant: 'blue', label: 'Booking' },
  tier: { icon: Crown, variant: 'rose', label: 'Tier' },
  promo: { icon: Gift, variant: 'green', label: 'Promo' },
  system: { icon: Bell, variant: 'gray', label: 'System' },
};

/**
 * Notifications page — inbox for app notifications.
 * Shows a placeholder UI for now, ready to connect to a notifications table.
 *
 * @returns {JSX.Element}
 */
export default function Notifications() {
  // Placeholder notifications — in production these come from Supabase
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'system',
      title: 'Welcome to Bocage Society!',
      body: 'Your Flûte membership is active. Start earning points with every visit.',
      read: true,
      created_at: new Date().toISOString(),
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  /**
   * Marks a notification as read.
   * @param {string} id - Notification ID
   */
  function markRead(id) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  /**
   * Marks all notifications as read.
   */
  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  /**
   * Removes a notification.
   * @param {string} id
   */
  function removeNotification(id) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : undefined}
        action={
          unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs font-sans text-champagne-500 hover:text-champagne-400"
            >
              <Check size={12} /> Mark all read
            </button>
          )
        }
      />

      {/* Empty state */}
      {notifications.length === 0 && (
        <EmptyState
          icon={<BellOff className="text-noir-500" size={32} />}
          title="No notifications"
          description="You're all caught up! Check back later."
        />
      )}

      {/* Notification list */}
      <div className="space-y-2">
        <AnimatePresence>
          {notifications.map((notif, i) => {
            const config = NOTIF_TYPES[notif.type] || NOTIF_TYPES.system;
            const Icon = config.icon;

            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12, height: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => markRead(notif.id)}
                className={`glass rounded-xl p-4 cursor-pointer transition-colors ${
                  !notif.read ? 'border-l-2 border-l-champagne-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    !notif.read ? 'bg-champagne-500/10' : 'bg-noir-800'
                  }`}>
                    <Icon size={16} className={!notif.read ? 'text-champagne-500' : 'text-noir-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`font-sans text-sm ${!notif.read ? 'text-white font-medium' : 'text-noir-200'}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-champagne-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="font-serif text-xs text-noir-400 line-clamp-2">{notif.body}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeNotification(notif.id); }}
                    className="p-1 text-noir-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
