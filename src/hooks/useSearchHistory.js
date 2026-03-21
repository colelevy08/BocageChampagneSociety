/**
 * @file src/hooks/useSearchHistory.js
 * @description Persisted search history for the wine catalog.
 * Stores recent search queries in localStorage with deduplication.
 * @importedBy src/pages/Menu.jsx
 */

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'bocage_search_history';
const MAX_HISTORY = 8;

/**
 * Hook for managing search history with localStorage persistence.
 *
 * @returns {{
 *   history: string[],
 *   addSearch: (query: string) => void,
 *   removeSearch: (query: string) => void,
 *   clearHistory: () => void
 * }}
 */
export function useSearchHistory() {
  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  /**
   * Saves a search query to history (deduplicates and caps at MAX_HISTORY).
   * @param {string} query - Search text to save
   */
  const addSearch = useCallback((query) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    setHistory((prev) => {
      const filtered = prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  /**
   * Removes a specific query from history.
   * @param {string} query
   */
  const removeSearch = useCallback((query) => {
    setHistory((prev) => {
      const updated = prev.filter((q) => q !== query);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  /**
   * Clears all search history.
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { history, addSearch, removeSearch, clearHistory };
}
