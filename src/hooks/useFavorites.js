/**
 * @file src/hooks/useFavorites.js
 * @description Member wine-favorites state. Loads the current member's favorited
 * wine IDs from bocage_wine_favorites and exposes an optimistic toggle. Used by
 * the Menu (heart buttons on cards + member pours) and Profile (My Favorites).
 * @importedBy src/pages/Menu.jsx, src/pages/Profile.jsx
 * @imports src/lib/supabase.js, src/context/AuthContext.jsx
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * Hook exposing the member's favorited wines.
 * @returns {{ favorites: Set<string>, toggle: (wineId:string)=>Promise<void>, loading: boolean, reload: ()=>Promise<void> }}
 *   favorites — Set of favorited wine IDs; toggle — add/remove a wine; loading —
 *   true until the first load resolves; reload — re-fetch from Supabase.
 */
export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState(() => new Set());
  const [loading, setLoading] = useState(true);

  /** Fetch the member's favorite wine IDs into a Set. */
  const load = useCallback(async () => {
    if (!user) {
      setFavorites(new Set());
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('bocage_wine_favorites')
      .select('wine_id')
      .eq('user_id', user.id);
    setFavorites(new Set((data || []).map((r) => r.wine_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Toggle a wine in/out of the member's favorites. Updates local state
   * optimistically, then writes to Supabase; on error it reloads to resync.
   * @param {string} wineId
   */
  const toggle = useCallback(
    async (wineId) => {
      if (!user) return;
      const isFav = favorites.has(wineId);

      // Optimistic update so the heart responds instantly.
      setFavorites((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(wineId);
        else next.add(wineId);
        return next;
      });

      const { error } = isFav
        ? await supabase
            .from('bocage_wine_favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('wine_id', wineId)
        : await supabase
            .from('bocage_wine_favorites')
            .insert({ user_id: user.id, wine_id: wineId });

      // If the write failed, pull authoritative state back from the server.
      if (error) load();
    },
    [user, favorites, load],
  );

  return { favorites, toggle, loading, reload: load };
}
