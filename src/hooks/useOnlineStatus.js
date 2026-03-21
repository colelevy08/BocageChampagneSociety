/**
 * @file src/hooks/useOnlineStatus.js
 * @description Hook to track network connectivity status.
 * Shows offline banner when connection is lost.
 * @importedBy src/components/layout/AppLayout.jsx
 */

import { useState, useEffect } from 'react';

/**
 * Returns the current online/offline status of the browser.
 * Automatically updates when connectivity changes.
 *
 * @returns {boolean} True if the device is online
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOnline;
}
