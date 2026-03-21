/**
 * @file src/pages/Menu.jsx
 * @description Wine and champagne catalog page for Bocage Champagne Society.
 * Fetches wines from Supabase, displays searchable/filterable card grid
 * with category tabs, featured badges, and glass/bottle pricing.
 * @importedBy src/App.jsx (route: /)
 * @imports src/lib/supabase.js, framer-motion, lucide-react
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, Wine as WineIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

/** Category filter options */
const CATEGORIES = ['all', 'champagne', 'sparkling', 'still', 'cocktail'];

/**
 * Menu page — displays the wine/champagne catalog.
 * Features search bar, category filter chips, and animated card grid.
 *
 * @returns {JSX.Element}
 */
export default function Menu() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  // Fetch wines from Supabase on mount
  useEffect(() => {
    fetchWines();
  }, []);

  /**
   * Fetches all available wines from the wines table, ordered by featured + name.
   */
  async function fetchWines() {
    setLoading(true);
    const { data, error } = await supabase
      .from('wines')
      .select('*')
      .eq('is_available', true)
      .order('is_featured', { ascending: false })
      .order('name');

    if (!error && data) setWines(data);
    setLoading(false);
  }

  // Filter wines by search query and category
  const filtered = wines.filter((wine) => {
    const matchesSearch =
      wine.name.toLowerCase().includes(search.toLowerCase()) ||
      wine.producer?.toLowerCase().includes(search.toLowerCase()) ||
      wine.region?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || wine.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl text-gradient-gold">La Carte</h1>
        <p className="font-serif text-noir-300 mt-1">Wines &amp; Champagnes</p>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search wines, producers, regions..."
          className="w-full bg-noir-800 border border-noir-700 rounded-xl pl-10 pr-4 py-3 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-600 transition-colors"
        />
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-sans whitespace-nowrap transition-colors ${
              category === cat
                ? 'bg-champagne-500 text-noir-900 font-medium'
                : 'bg-noir-800 text-noir-300 border border-noir-700'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-champagne-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20">
          <WineIcon className="mx-auto text-noir-600 mb-3" size={48} />
          <p className="font-serif text-noir-400">No wines found</p>
        </div>
      )}

      {/* Wine card grid */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.map((wine, index) => (
          <motion.div
            key={wine.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="glass rounded-2xl overflow-hidden"
          >
            <div className="flex">
              {/* Wine image */}
              {wine.image_url ? (
                <img
                  src={wine.image_url}
                  alt={wine.name}
                  className="w-24 h-28 object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-24 h-28 bg-noir-700 flex items-center justify-center flex-shrink-0">
                  <WineIcon className="text-noir-500" size={28} />
                </div>
              )}

              {/* Wine details */}
              <div className="flex-1 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base text-white leading-tight">
                      {wine.name}
                    </h3>
                    <p className="font-sans text-xs text-noir-400 mt-0.5">
                      {[wine.producer, wine.region, wine.vintage].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {wine.is_featured && (
                    <Star className="text-champagne-500 flex-shrink-0" size={16} fill="currentColor" />
                  )}
                </div>

                {/* Description */}
                {wine.description && (
                  <p className="font-serif text-xs text-noir-300 mt-2 line-clamp-2">
                    {wine.description}
                  </p>
                )}

                {/* Pricing */}
                <div className="flex items-center gap-3 mt-2">
                  {wine.price_glass && (
                    <span className="text-champagne-500 font-sans text-sm font-medium">
                      ${Number(wine.price_glass).toFixed(0)}{' '}
                      <span className="text-noir-400 text-xs">glass</span>
                    </span>
                  )}
                  {wine.price_bottle && (
                    <span className="text-champagne-300 font-sans text-sm font-medium">
                      ${Number(wine.price_bottle).toFixed(0)}{' '}
                      <span className="text-noir-400 text-xs">bottle</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
