/**
 * @file src/pages/Menu.jsx
 * @description Wine and champagne catalog page for Bocage Champagne Society.
 * Features searchable/filterable card grid with category tabs, grid/list view toggle,
 * sort options, skeleton loading, pull-to-refresh, wine detail modal, and debounced search.
 * @importedBy src/App.jsx (route: /)
 * @imports src/lib/supabase.js, src/components/ui/*, src/components/WineDetailModal.jsx,
 *          src/hooks/useDebounce.js, src/hooks/usePullToRefresh.js, framer-motion, lucide-react
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Wine as WineIcon, Grid3X3, List, X, SlidersHorizontal, ArrowUpDown, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import { WineCardSkeleton } from '../components/ui/Skeleton';
import WineDetailModal from '../components/WineDetailModal';
import { useDebounce } from '../hooks/useDebounce';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

/** Category filter options */
const CATEGORIES = ['all', 'champagne', 'sparkling', 'still', 'cocktail'];

/** Sort options */
const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'price-low', label: 'Price: Low' },
  { value: 'price-high', label: 'Price: High' },
  { value: 'newest', label: 'Newest' },
];

/**
 * Menu page — displays the wine/champagne catalog with rich filtering,
 * sorting, view modes, and a detail modal.
 *
 * @returns {JSX.Element}
 */
export default function Menu() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [sortBy, setSortBy] = useState('featured');
  const [showSort, setShowSort] = useState(false);
  const [selectedWine, setSelectedWine] = useState(null);

  const debouncedSearch = useDebounce(search, 250);

  // Pull-to-refresh support
  const fetchWines = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wines')
      .select('*')
      .eq('is_available', true)
      .order('is_featured', { ascending: false })
      .order('name');
    if (!error && data) setWines(data);
    setLoading(false);
  }, []);

  const { isRefreshing, pullDistance } = usePullToRefresh(fetchWines);

  useEffect(() => { fetchWines(); }, [fetchWines]);

  // Filter + sort wines
  const processed = wines
    .filter((wine) => {
      const q = debouncedSearch.toLowerCase();
      const matchesSearch = !q ||
        wine.name.toLowerCase().includes(q) ||
        wine.producer?.toLowerCase().includes(q) ||
        wine.region?.toLowerCase().includes(q) ||
        wine.description?.toLowerCase().includes(q);
      const matchesCategory = category === 'all' || wine.category === category;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'price-low': return (a.price_glass || 0) - (b.price_glass || 0);
        case 'price-high': return (b.price_glass || 0) - (a.price_glass || 0);
        case 'newest': return new Date(b.created_at) - new Date(a.created_at);
        default: return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      }
    });

  const featuredCount = wines.filter((w) => w.is_featured).length;

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div className="flex justify-center -mt-4 mb-2">
          <RefreshCw
            size={20}
            className={`text-champagne-500 transition-transform ${isRefreshing ? 'animate-spin' : ''}`}
            style={{ transform: `rotate(${pullDistance * 3}deg)` }}
          />
        </div>
      )}

      <PageHeader
        title="La Carte"
        subtitle={`${wines.length} wines & champagnes`}
      />

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search wines, producers, regions..."
          className="w-full bg-noir-800 border border-noir-700 rounded-xl pl-10 pr-10 py-3 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-600 transition-colors"
        />
        {/* Clear search button */}
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-noir-400 hover:text-white p-0.5"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Controls row: categories + view/sort toggles */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-sans whitespace-nowrap transition-all ${
                  category === cat
                    ? 'bg-champagne-500 text-noir-900 font-medium shadow-md shadow-champagne-500/20'
                    : 'bg-noir-800 text-noir-300 border border-noir-700 hover:border-noir-500'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* View mode + sort controls */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-sans text-noir-500">
          {processed.length} result{processed.length !== 1 ? 's' : ''}
          {category !== 'all' && ` in ${category}`}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSort(!showSort)}
            className={`p-2 rounded-lg transition-colors ${showSort ? 'text-champagne-500 bg-champagne-500/10' : 'text-noir-400 hover:text-white'}`}
          >
            <ArrowUpDown size={16} />
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="p-2 rounded-lg text-noir-400 hover:text-white transition-colors"
          >
            {viewMode === 'list' ? <Grid3X3 size={16} /> : <List size={16} />}
          </button>
        </div>
      </div>

      {/* Sort dropdown */}
      <AnimatePresence>
        {showSort && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSortBy(opt.value); setShowSort(false); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-colors ${
                    sortBy === opt.value
                      ? 'bg-champagne-500/20 text-champagne-400 border border-champagne-500/30'
                      : 'bg-noir-800 text-noir-400 border border-noir-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <WineCardSkeleton key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && processed.length === 0 && (
        <EmptyState
          icon={<WineIcon className="text-noir-500" size={32} />}
          title="No wines found"
          description={search ? 'Try adjusting your search or filters' : 'Check back soon for new additions'}
          action={search && (
            <button
              onClick={() => { setSearch(''); setCategory('all'); }}
              className="text-champagne-500 font-sans text-sm underline"
            >
              Clear filters
            </button>
          )}
        />
      )}

      {/* Wine cards — list view */}
      {!loading && viewMode === 'list' && (
        <div className="space-y-3">
          {processed.map((wine, index) => (
            <motion.button
              key={wine.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
              onClick={() => setSelectedWine(wine)}
              className="w-full text-left glass rounded-2xl overflow-hidden hover-lift"
            >
              <div className="flex">
                {wine.image_url ? (
                  <img src={wine.image_url} alt={wine.name} className="w-24 h-28 object-cover flex-shrink-0" />
                ) : (
                  <div className="w-24 h-28 bg-noir-700 flex items-center justify-center flex-shrink-0">
                    <WineIcon className="text-noir-500" size={28} />
                  </div>
                )}
                <div className="flex-1 p-3 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-display text-base text-white leading-tight truncate">{wine.name}</h3>
                      <p className="font-sans text-xs text-noir-400 mt-0.5 truncate">
                        {[wine.producer, wine.region, wine.vintage].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    {wine.is_featured && (
                      <Star className="text-champagne-500 flex-shrink-0" size={14} fill="currentColor" />
                    )}
                  </div>
                  {wine.description && (
                    <p className="font-serif text-xs text-noir-300 mt-1.5 line-clamp-2">{wine.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {wine.price_glass && (
                      <span className="text-champagne-500 font-sans text-sm font-medium">
                        ${Number(wine.price_glass).toFixed(0)} <span className="text-noir-500 text-xs">glass</span>
                      </span>
                    )}
                    {wine.price_bottle && (
                      <span className="text-champagne-300 font-sans text-sm font-medium">
                        ${Number(wine.price_bottle).toFixed(0)} <span className="text-noir-500 text-xs">bottle</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Wine cards — grid view */}
      {!loading && viewMode === 'grid' && (
        <div className="grid grid-cols-2 gap-3">
          {processed.map((wine, index) => (
            <motion.button
              key={wine.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => setSelectedWine(wine)}
              className="text-left glass rounded-xl overflow-hidden hover-lift"
            >
              {wine.image_url ? (
                <img src={wine.image_url} alt={wine.name} className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 bg-noir-700 flex items-center justify-center">
                  <WineIcon className="text-noir-500" size={24} />
                </div>
              )}
              <div className="p-2.5">
                <h3 className="font-display text-sm text-white leading-tight line-clamp-1">{wine.name}</h3>
                <p className="font-sans text-xs text-noir-400 mt-0.5 line-clamp-1">
                  {wine.producer || wine.region || wine.category}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  {wine.price_glass && (
                    <span className="text-champagne-500 font-sans text-xs font-medium">
                      ${Number(wine.price_glass).toFixed(0)}
                    </span>
                  )}
                  {wine.is_featured && <Star className="text-champagne-500" size={10} fill="currentColor" />}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Wine detail modal */}
      <WineDetailModal
        wine={selectedWine}
        isOpen={!!selectedWine}
        onClose={() => setSelectedWine(null)}
      />
    </div>
  );
}
