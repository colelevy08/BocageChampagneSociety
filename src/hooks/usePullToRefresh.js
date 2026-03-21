/**
 * @file src/hooks/usePullToRefresh.js
 * @description Pull-to-refresh hook for mobile UX. Detects pull-down gesture
 * at the top of the page and triggers a refresh callback.
 * @importedBy src/pages/Menu.jsx, Events.jsx, Membership.jsx
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook that enables pull-to-refresh behavior on a scrollable container.
 *
 * @param {Function} onRefresh - Async function to call when user pulls to refresh
 * @param {object} options
 * @param {number} options.threshold - Pixels to pull before triggering (default 80)
 * @returns {{ isRefreshing: boolean, pullDistance: number, containerRef: React.RefObject }}
 */
export function usePullToRefresh(onRefresh, { threshold = 80 } = {}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const pulling = useRef(false);

  const handleTouchStart = useCallback((e) => {
    // Only activate when scrolled to top
    if (window.scrollY <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!pulling.current || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    // Apply resistance — diminish the pull as it gets larger
    setPullDistance(Math.min(distance * 0.4, threshold * 1.5));
  }, [isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { isRefreshing, pullDistance };
}
