/**
 * @file src/hooks/useDebounce.js
 * @description Debounce hook for delaying value updates (e.g., search input).
 * Prevents excessive re-renders and API calls during rapid typing.
 * @importedBy src/pages/Menu.jsx, AdminInventory.jsx
 */

import { useState, useEffect } from 'react';

/**
 * Returns a debounced version of the provided value.
 * Updates only after the specified delay has passed since the last change.
 *
 * @param {any} value - The value to debounce
 * @param {number} delay - Debounce delay in milliseconds (default 300)
 * @returns {any} The debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
