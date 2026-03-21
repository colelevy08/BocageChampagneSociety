/**
 * @file src/pages/AdminInventory.jsx
 * @description Admin-only wine inventory management page with search, category filters,
 * stats dashboard, styled modals, confirmation dialogs, toast feedback, and availability toggles.
 * Uses ImageUpload component for drag-and-drop wine photo uploads to Supabase Storage.
 * @importedBy src/App.jsx (route: /admin/inventory, guarded by isAdmin)
 * @imports src/lib/supabase.js, src/lib/storage.js, src/context/AuthContext.jsx,
 *          src/components/ui/*, src/hooks/*, framer-motion, lucide-react
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Edit3, Wine as WineIcon, Eye, EyeOff,
  Save, Search, Package, Star, TrendingUp,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import ImageUpload from '../components/ui/ImageUpload';
import { InventoryItemSkeleton } from '../components/ui/Skeleton';
import { useDebounce } from '../hooks/useDebounce';
import { useHaptics } from '../hooks/useHaptics';

const EMPTY_WINE = {
  name: '', producer: '', region: '', vintage: '', category: 'champagne',
  description: '', price_glass: '', price_bottle: '', stock_count: '',
  is_available: true, is_featured: false,
};

const CATEGORIES = ['all', 'champagne', 'sparkling', 'still', 'cocktail'];

/**
 * AdminInventory page — CRUD interface with stats, search, filters, and toast feedback.
 * @returns {JSX.Element}
 */
export default function AdminInventory() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const haptics = useHaptics();
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_WINE });
  const [imageUrl, setImageUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all'); // 'all' | 'available' | 'hidden'
  const [deleteTarget, setDeleteTarget] = useState(null);

  const debouncedSearch = useDebounce(search, 250);

  const fetchWines = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('wines')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setWines(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchWines(); }, [fetchWines]);

  // Computed stats
  const stats = {
    total: wines.length,
    available: wines.filter((w) => w.is_available).length,
    featured: wines.filter((w) => w.is_featured).length,
    lowStock: wines.filter((w) => w.stock_count !== null && w.stock_count <= 5 && w.stock_count > 0).length,
    outOfStock: wines.filter((w) => w.stock_count === 0).length,
  };

  // Filter wines
  const filtered = wines.filter((w) => {
    const q = debouncedSearch.toLowerCase();
    const matchesSearch = !q || w.name.toLowerCase().includes(q) || w.producer?.toLowerCase().includes(q);
    const matchesCat = filterCategory === 'all' || w.category === filterCategory;
    const matchesAvail = filterAvailability === 'all'
      || (filterAvailability === 'available' && w.is_available)
      || (filterAvailability === 'hidden' && !w.is_available);
    return matchesSearch && matchesCat && matchesAvail;
  });

  function handleAdd() {
    setForm({ ...EMPTY_WINE });
    setEditingId(null);
    setImageUrl(null);
    setShowForm(true);
  }

  function handleEdit(wine) {
    setForm({
      name: wine.name || '',
      producer: wine.producer || '',
      region: wine.region || '',
      vintage: wine.vintage || '',
      category: wine.category || 'champagne',
      description: wine.description || '',
      price_glass: wine.price_glass || '',
      price_bottle: wine.price_bottle || '',
      stock_count: wine.stock_count ?? '',
      is_available: wine.is_available,
      is_featured: wine.is_featured,
    });
    setEditingId(wine.id);
    setImageUrl(wine.image_url || null);
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    const wineData = {
      name: form.name,
      producer: form.producer || null,
      region: form.region || null,
      vintage: form.vintage ? parseInt(form.vintage, 10) : null,
      category: form.category,
      description: form.description || null,
      price_glass: form.price_glass ? parseFloat(form.price_glass) : null,
      price_bottle: form.price_bottle ? parseFloat(form.price_bottle) : null,
      stock_count: form.stock_count !== '' ? parseInt(form.stock_count, 10) : null,
      is_available: form.is_available,
      is_featured: form.is_featured,
      image_url: imageUrl || null,
    };

    const { error } = editingId
      ? await supabase.from('wines').update(wineData).eq('id', editingId)
      : await supabase.from('wines').insert(wineData);

    if (error) {
      toast.error('Failed to save wine.');
    } else {
      toast.success(editingId ? 'Wine updated!' : 'Wine added!');
      haptics.success();
      setShowForm(false);
      fetchWines();
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.from('wines').delete().eq('id', deleteTarget);
    if (error) {
      toast.error('Failed to delete wine.');
    } else {
      toast.success('Wine removed.');
      fetchWines();
    }
    setDeleteTarget(null);
  }

  async function toggleAvailability(id, current) {
    await supabase.from('wines').update({ is_available: !current }).eq('id', id);
    haptics.light();
    fetchWines();
  }

  if (!isAdmin) {
    return (
      <EmptyState
        icon={<Package className="text-noir-500" size={32} />}
        title="Admin access required"
        description="Contact an administrator for access"
      />
    );
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <PageHeader
        title="Inventory"
        subtitle="Wine Management"
        action={
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={handleAdd}>
            Add Wine
          </Button>
        }
      />

      {/* Stats dashboard */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: 'Total', value: stats.total, icon: Package, color: 'text-champagne-500' },
          { label: 'Live', value: stats.available, icon: Eye, color: 'text-emerald-400' },
          { label: 'Featured', value: stats.featured, icon: Star, color: 'text-champagne-400' },
          { label: 'Low Stock', value: stats.lowStock + stats.outOfStock, icon: TrendingUp, color: 'text-rose-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-2.5 text-center"
          >
            <stat.icon size={14} className={`${stat.color} mx-auto mb-1`} />
            <p className="font-display text-lg text-white">{stat.value}</p>
            <p className="font-sans text-xs text-noir-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-400" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search wines..."
          className="w-full bg-noir-800 border border-noir-700 rounded-lg pl-9 pr-4 py-2.5 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-sans whitespace-nowrap transition-colors ${
              filterCategory === cat ? 'bg-champagne-500 text-noir-900' : 'bg-noir-800 text-noir-400 border border-noir-700'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
        <div className="w-px bg-noir-700 mx-1" />
        {['all', 'available', 'hidden'].map((av) => (
          <button
            key={av}
            onClick={() => setFilterAvailability(av)}
            className={`px-3 py-1 rounded-full text-xs font-sans whitespace-nowrap transition-colors ${
              filterAvailability === av ? 'bg-champagne-500/20 text-champagne-400 border border-champagne-500/30' : 'bg-noir-800 text-noir-400 border border-noir-700'
            }`}
          >
            {av.charAt(0).toUpperCase() + av.slice(1)}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs font-sans text-noir-500 mb-3">{filtered.length} wines</p>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <InventoryItemSkeleton key={i} />)}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={<WineIcon className="text-noir-500" size={32} />}
          title="No wines found"
          description={search ? 'Try a different search' : 'Add your first wine to get started'}
          action={!search && <Button variant="primary" size="sm" onClick={handleAdd}>Add Wine</Button>}
        />
      )}

      {/* Wine list */}
      <div className="space-y-2">
        {filtered.map((wine) => (
          <motion.div
            key={wine.id}
            layout
            className={`glass rounded-xl p-3 transition-opacity ${!wine.is_available ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center gap-3">
              {wine.image_url ? (
                <img src={wine.image_url} alt={wine.name} className="w-11 h-13 object-cover rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-11 h-13 bg-noir-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <WineIcon className="text-noir-500" size={16} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-sm text-white truncate">{wine.name}</h3>
                  {wine.is_featured && <Star size={10} className="text-champagne-500 flex-shrink-0" fill="currentColor" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="gray" size="sm">{wine.category}</Badge>
                  {wine.stock_count !== null && (
                    <span className={`font-sans text-xs ${wine.stock_count <= 5 ? 'text-rose-400' : 'text-noir-400'}`}>
                      {wine.stock_count} in stock
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={() => toggleAvailability(wine.id, wine.is_available)} className="p-2 text-noir-400 hover:text-champagne-500">
                  {wine.is_available ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => handleEdit(wine)} className="p-2 text-noir-400 hover:text-champagne-500">
                  <Edit3 size={14} />
                </button>
                <button onClick={() => setDeleteTarget(wine.id)} className="p-2 text-noir-400 hover:text-rose-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Wine' : 'Add Wine'} size="md">
        <form onSubmit={handleSave} className="space-y-3">
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Wine name *" required className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-2.5 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500" />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={form.producer} onChange={(e) => setForm({ ...form, producer: e.target.value })} placeholder="Producer" className="bg-noir-800 border border-noir-700 rounded-lg px-4 py-2.5 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500" />
            <input type="text" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="Region" className="bg-noir-800 border border-noir-700 rounded-lg px-4 py-2.5 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={form.vintage} onChange={(e) => setForm({ ...form, vintage: e.target.value })} placeholder="Vintage" className="bg-noir-800 border border-noir-700 rounded-lg px-4 py-2.5 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-noir-800 border border-noir-700 rounded-lg px-4 py-2.5 text-white font-sans text-sm focus:outline-none focus:border-champagne-500">
              <option value="champagne">Champagne</option>
              <option value="sparkling">Sparkling</option>
              <option value="still">Still</option>
              <option value="cocktail">Cocktail</option>
            </select>
          </div>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tasting notes..." rows={2} className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-2.5 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500 resize-none" />
          <div className="grid grid-cols-3 gap-3">
            <input type="number" step="0.01" value={form.price_glass} onChange={(e) => setForm({ ...form, price_glass: e.target.value })} placeholder="Glass $" className="bg-noir-800 border border-noir-700 rounded-lg px-3 py-2.5 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500" />
            <input type="number" step="0.01" value={form.price_bottle} onChange={(e) => setForm({ ...form, price_bottle: e.target.value })} placeholder="Bottle $" className="bg-noir-800 border border-noir-700 rounded-lg px-3 py-2.5 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500" />
            <input type="number" value={form.stock_count} onChange={(e) => setForm({ ...form, stock_count: e.target.value })} placeholder="Stock" className="bg-noir-800 border border-noir-700 rounded-lg px-3 py-2.5 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500" />
          </div>
          <ImageUpload
            bucket="wine-images"
            currentUrl={imageUrl}
            onUpload={(url) => setImageUrl(url)}
            onRemove={() => setImageUrl(null)}
            placeholder="Upload bottle photo"
          />
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} className="accent-champagne-500" />
              <span className="font-sans text-sm text-noir-300">Available</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="accent-champagne-500" />
              <span className="font-sans text-sm text-noir-300">Featured</span>
            </label>
          </div>
          <Button variant="primary" size="full" loading={saving} icon={<Save size={14} />} type="submit">
            {editingId ? 'Update Wine' : 'Add Wine'}
          </Button>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Wine?"
        message="This wine will be permanently removed from the catalog."
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
