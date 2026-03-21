/**
 * @file src/components/ui/Skeleton.jsx
 * @description Skeleton loading placeholder components for Bocage Champagne Society.
 * Provides shimmering placeholders that match the shape of real content
 * for a smoother perceived loading experience.
 * @importedBy src/pages/Menu.jsx, Events.jsx, Membership.jsx, AdminInventory.jsx
 */

import { motion } from 'framer-motion';

/**
 * Base skeleton block with shimmer animation.
 * @param {object} props
 * @param {string} props.className - Additional Tailwind classes for sizing/shape
 * @returns {JSX.Element}
 */
export function Skeleton({ className = '' }) {
  return (
    <div className={`skeleton rounded-lg ${className}`} />
  );
}

/**
 * Wine card skeleton — matches the layout of a wine card on the Menu page.
 * @returns {JSX.Element}
 */
export function WineCardSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="flex">
        <Skeleton className="w-24 h-28 rounded-none flex-shrink-0" />
        <div className="flex-1 p-3 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-full mt-2" />
          <div className="flex gap-3 mt-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Event card skeleton — matches the layout of an event card.
 * @returns {JSX.Element}
 */
export function EventCardSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <Skeleton className="w-full h-40 rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <div className="flex gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * Profile card skeleton.
 * @returns {JSX.Element}
 */
export function ProfileSkeleton() {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

/**
 * Stat card skeleton — for dashboard numbers.
 * @returns {JSX.Element}
 */
export function StatSkeleton() {
  return (
    <div className="glass rounded-xl p-4 space-y-2">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

/**
 * Inventory list item skeleton.
 * @returns {JSX.Element}
 */
export function InventoryItemSkeleton() {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-12 h-14 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="w-8 h-8 rounded" />
          <Skeleton className="w-8 h-8 rounded" />
          <Skeleton className="w-8 h-8 rounded" />
        </div>
      </div>
    </div>
  );
}
