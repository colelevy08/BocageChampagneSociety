/**
 * @file src/pages/AdminInventory.jsx
 * @description Admin-only wine inventory management page.
 * Provides full CRUD (create, read, update, delete) for wines with
 * photo uploads to Supabase Storage, availability toggles, and stock tracking.
 * @importedBy src/App.jsx (route: /admin/inventory, guarded by isAdmin)
 * @imports src/lib/supabase.js, src/context/AuthContext.jsx, framer-motion, lucide-react
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  Upload,
  Trash2,
  Edit3,
  Wine as WineIcon,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/** Empty wine form template */
const EMPTY_WINE = {
  name: '',
  producer: '',
  region: '',
  vintage: '',
  category: 'champagne',
  description: '',
  price_glass: '',
  price_bottle: '',
  stock_count: '',
  is_available: true,
  is_featured: false,
};

/**
 * AdminInventory page — CRUD interface for managing the wine catalog.
 * Only accessible to users with role === 'admin'.
 *
 * @returns {JSX.Element}
 */
export default function AdminInventory() {
  const { isAdmin } = useAuth();
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_WINE });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch all wines on mount
  useEffect(() => {
    fetchWines();
  }, []);

  /**
   * Fetches all wines (available and unavailable) for admin management.
   */
  async function fetchWines() {
    setLoading(true);
    const { data } = await supabase
      .from('wines')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setWines(data);
    setLoading(false);
  }

  /**
   * Opens the form for adding a new wine.
   */
  function handleAdd() {
    setForm({ ...EMPTY_WINE });
    setEditingId(null);
    setImageFile(null);
    setShowForm(true);
  }

  /**
   * Opens the form pre-filled with an existing wine's data for editing.
   * @param {object} wine - The wine record to edit
   */
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
    setImageFile(null);
    setShowForm(true);
  }

  /**
   * Uploads an image to Supabase Storage and returns the public URL.
   * @param {File} file - The image file to upload
   * @returns {Promise<string|null>} The public URL or null on failure
   */
  async function uploadImage(file) {
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from('wine-images')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data } = supabase.storage.from('wine-images').getPublicUrl(path);
    return data?.publicUrl || null;
  }

  /**
   * Saves the wine form — creates a new wine or updates an existing one.
   * Handles image upload if a file was selected.
   * @param {React.FormEvent} e
   */
  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }

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
      ...(imageUrl && { image_url: imageUrl }),
    };

    if (editingId) {
      await supabase.from('wines').update(wineData).eq('id', editingId);
    } else {
      await supabase.from('wines').insert(wineData);
    }

    setSaving(false);
    setShowForm(false);
    fetchWines();
  }

  /**
   * Deletes a wine after confirmation.
   * @param {string} id - The wine's UUID
   */
  async function handleDelete(id) {
    const confirmed = window.confirm('Delete this wine? This cannot be undone.');
    if (!confirmed) return;
    await supabase.from('wines').delete().eq('id', id);
    fetchWines();
  }

  /**
   * Toggles a wine's availability status directly from the list.
   * @param {string} id - The wine's UUID
   * @param {boolean} currentAvailability - Current is_available value
   */
  async function toggleAvailability(id, currentAvailability) {
    await supabase
      .from('wines')
      .update({ is_available: !currentAvailability })
      .eq('id', id);
    fetchWines();
  }

  // Guard: non-admin users see nothing
  if (!isAdmin) {
    return (
      <div className="px-4 pt-6">
        <p className="font-serif text-noir-400 text-center py-20">
          Admin access required.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-gradient-gold">Inventory</h1>
          <p className="font-serif text-noir-300 mt-1">Wine Management</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 bg-champagne-500 text-noir-900 font-sans font-medium text-sm px-4 py-2 rounded-lg hover:bg-champagne-400 transition-colors"
        >
          <Plus size={16} /> Add Wine
        </button>
      </div>

      {/* Wine form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-noir-900/90 z-50 overflow-y-auto"
          >
            <div className="min-h-screen px-4 py-8">
              <div className="max-w-lg mx-auto glass rounded-2xl p-6">
                {/* Form header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl text-white">
                    {editingId ? 'Edit Wine' : 'Add Wine'}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-noir-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  {/* Name */}
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Wine name *"
                    required
                    className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-3 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500"
                  />

                  {/* Producer + Region */}
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={form.producer}
                      onChange={(e) => setForm({ ...form, producer: e.target.value })}
                      placeholder="Producer"
                      className="bg-noir-800 border border-noir-700 rounded-lg px-4 py-3 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500"
                    />
                    <input
                      type="text"
                      value={form.region}
                      onChange={(e) => setForm({ ...form, region: e.target.value })}
                      placeholder="Region"
                      className="bg-noir-800 border border-noir-700 rounded-lg px-4 py-3 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500"
                    />
                  </div>

                  {/* Vintage + Category */}
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={form.vintage}
                      onChange={(e) => setForm({ ...form, vintage: e.target.value })}
                      placeholder="Vintage year"
                      className="bg-noir-800 border border-noir-700 rounded-lg px-4 py-3 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500"
                    />
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="bg-noir-800 border border-noir-700 rounded-lg px-4 py-3 text-white font-sans text-sm focus:outline-none focus:border-champagne-500"
                    >
                      <option value="champagne">Champagne</option>
                      <option value="sparkling">Sparkling</option>
                      <option value="still">Still</option>
                      <option value="cocktail">Cocktail</option>
                    </select>
                  </div>

                  {/* Description */}
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Tasting notes..."
                    rows={2}
                    className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-3 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500 resize-none"
                  />

                  {/* Pricing */}
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="number"
                      step="0.01"
                      value={form.price_glass}
                      onChange={(e) => setForm({ ...form, price_glass: e.target.value })}
                      placeholder="Glass $"
                      className="bg-noir-800 border border-noir-700 rounded-lg px-4 py-3 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={form.price_bottle}
                      onChange={(e) => setForm({ ...form, price_bottle: e.target.value })}
                      placeholder="Bottle $"
                      className="bg-noir-800 border border-noir-700 rounded-lg px-4 py-3 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500"
                    />
                    <input
                      type="number"
                      value={form.stock_count}
                      onChange={(e) => setForm({ ...form, stock_count: e.target.value })}
                      placeholder="Stock"
                      className="bg-noir-800 border border-noir-700 rounded-lg px-4 py-3 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500"
                    />
                  </div>

                  {/* Image upload */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 bg-noir-800 border border-noir-700 rounded-lg px-4 py-3 text-noir-400 font-sans text-sm hover:border-champagne-600 transition-colors w-full"
                    >
                      <Upload size={16} />
                      {imageFile ? imageFile.name : 'Upload bottle photo'}
                    </button>
                  </div>

                  {/* Toggles */}
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_available}
                        onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                        className="accent-champagne-500"
                      />
                      <span className="font-sans text-sm text-noir-300">Available</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_featured}
                        onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                        className="accent-champagne-500"
                      />
                      <span className="font-sans text-sm text-noir-300">Featured</span>
                    </label>
                  </div>

                  {/* Save button */}
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-champagne-500 text-noir-900 font-sans font-semibold py-3.5 rounded-lg shimmer-gold hover:bg-champagne-400 transition-colors disabled:opacity-50"
                  >
                    <Save size={16} />
                    {saving ? 'Saving...' : editingId ? 'Update Wine' : 'Add Wine'}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-champagne-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Wine list */}
      <div className="space-y-3">
        {wines.map((wine) => (
          <motion.div
            key={wine.id}
            layout
            className={`glass rounded-xl p-4 ${!wine.is_available ? 'opacity-50' : ''}`}
          >
            <div className="flex items-start gap-3">
              {/* Thumbnail */}
              {wine.image_url ? (
                <img
                  src={wine.image_url}
                  alt={wine.name}
                  className="w-12 h-14 object-cover rounded-lg flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-14 bg-noir-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <WineIcon className="text-noir-500" size={18} />
                </div>
              )}

              {/* Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base text-white truncate">{wine.name}</h3>
                <p className="font-sans text-xs text-noir-400">
                  {wine.category} · {wine.stock_count ?? '—'} in stock
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => toggleAvailability(wine.id, wine.is_available)}
                  className="p-2 text-noir-400 hover:text-champagne-500 transition-colors"
                  title={wine.is_available ? 'Hide' : 'Show'}
                >
                  {wine.is_available ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => handleEdit(wine)}
                  className="p-2 text-noir-400 hover:text-champagne-500 transition-colors"
                  title="Edit"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(wine.id)}
                  className="p-2 text-noir-400 hover:text-rose-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
