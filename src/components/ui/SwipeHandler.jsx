/**
 * @file src/components/ui/SwipeHandler.jsx
 * @description Wraps content with swipe gesture detection for mobile navigation.
 * Detects horizontal swipe gestures and triggers callbacks for left/right swipes.
 * @importedBy src/pages/Onboarding.jsx, src/components/layout/AppLayout.jsx
 */

import { useRef, useCallback } from 'react';

/**
 * SwipeHandler — detects horizontal swipe gestures on touch devices.
 *
 * @param {object} props
 * @param {Function} props.onSwipeLeft - Called on left swipe (> threshold)
 * @param {Function} props.onSwipeRight - Called on right swipe (> threshold)
 * @param {number} props.threshold - Minimum swipe distance in px (default 50)
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
export default function SwipeHandler({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  children,
}) {
  const startX = useRef(0);
  const startY = useRef(0);

  const handleTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - startX.current;
    const diffY = endY - startY.current;

    // Only trigger if horizontal movement > vertical (not a scroll)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
      if (diffX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (diffX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}
