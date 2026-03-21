/**
 * @file src/hooks/useFavorites.js
 * @description Local storage-backed favorites/wishlist system for wines.
 * Persists favorites across sessions without requiring Supabase.
 * @importedBy src/pages/Menu.jsx, src/components/WineDetailModal.jsx
 */

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'bocage_wine_favorites';

/**
 * Reads favorites array from localStorage.
 * @returns {string[]} Array of wine IDs
 */
function readFavorites() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Writes favorites array to localStorage.
 * @param {string[]} favs - Array of wine IDs
 */
function writeFavorites(favs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
}

/**
 * Hook for managing a wine favorites/wishlist.
 * Persisted in localStorage, provides toggle, check, and count.
 *
 * @returns {{
 *   favorites: string[],
 *   isFavorite: (id: string) => boolean,
 *   toggleFavorite: (id: string) => void,
 *   clearFavorites: () => void,
 *   count: number
 * }}
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState(readFavorites);

  // Sync to localStorage whenever favorites change
  useEffect(() => {
    writeFavorites(favorites);
  }, [favorites]);

  /**
   * Checks if a wine ID is in favorites.
   * @param {string} id - Wine UUID
   * @returns {boolean}
   */
  const isFavorite = useCallback(
    (id) => favorites.includes(id),
    [favorites]
  );

  /**
   * Toggles a wine in/out of favorites.
   * @param {string} id - Wine UUID
   */
  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }, []);

  /**
   * Clears all favorites.
   */
  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    clearFavorites,
    count: favorites.length,
  };
}
