/**
 * @file src/pages/AdminEvents.jsx
 * @description Admin event management page for creating, editing, and managing events.
 * Features event list with status badges, create/edit modal form, and toggle active status.
 * @importedBy src/App.jsx (route: /admin/events, guarded by isAdmin)
 * @imports src/lib/supabase.js, src/context/AuthContext.jsx, src/components/ui/*,
 *          framer-motion, lucide-react, date-fns
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, CalendarDays, MapPin, Users, Edit3, Eye, EyeOff, Save,
  Trash2, DollarSign, Image,
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import { useHaptics } from '../hooks/useHaptics';

const EMPTY_EVENT = {
  title: '',
  description: '',
  event_date: '',
  event_time: '19:00',
  location: '10 Phila St, Saratoga Springs',
  image_url: '',
  max_seats: '',
  min_tier: 'flute',
  price: '',
  is_active: true,
};

/**
 * AdminEvents page — CRUD for event management.
 * @returns {JSX.Element}
 */
export default function AdminEvents() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const haptics = useHaptics();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_EVENT });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false });
    if (data) setEvents(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  function handleAdd() {
    setForm({ ...EMPTY_EVENT });
    setEditingId(null);
    setShowForm(true);
  }

  function handleEdit(event) {
    const d = event.event_date ? new Date(event.event_date) : null;
    setForm({
      title: event.title || '',
      description: event.description || '',
      event_date: d ? format(d, 'yyyy-MM-dd') : '',
      event_time: d ? format(d, 'HH:mm') : '19:00',
      location: event.location || '',
      image_url: event.image_url || '',
      max_seats: event.max_seats || '',
      min_tier: event.min_tier || 'flute',
      price: event.price || '',
      is_active: event.is_active,
    });
    setEditingId(event.id);
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    const eventDate = form.event_date && form.event_time
      ? new Date(`${form.event_date}T${form.event_time}`).toISOString()
      : null;

    const maxSeats = form.max_seats ? parseInt(form.max_seats, 10) : null;

    const eventData = {
      title: form.title,
      description: form.description || null,
      event_date: eventDate,
      location: form.location || null,
      image_url: form.image_url || null,
      max_seats: maxSeats,
      seats_remaining: editingId ? undefined : maxSeats, // Only set on create
      min_tier: form.min_tier,
      price: form.price ? parseFloat(form.price) : null,
      is_active: form.is_active,
    };

    // Remove undefined keys
    Object.keys(eventData).forEach((k) => eventData[k] === undefined && delete eventData[k]);

    const { error } = editingId
      ? await supabase.from('events').update(eventData).eq('id', editingId)
      : await supabase.from('events').insert(eventData);

    if (error) {
      toast.error('Failed to save event.');
    } else {
      toast.success(editingId ? 'Event updated!' : 'Event created!');
      haptics.success();
      setShowForm(false);
      fetchEvents();
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.from('events').delete().eq('id', deleteTarget);
    if (error) {
      toast.error('Failed to delete event.');
    } else {
      toast.success('Event deleted.');
      fetchEvents();
    }
    setDeleteTarget(null);
  }

  async function toggleActive(id, current) {
    await supabase.from('events').update({ is_active: !current }).eq('id', id);
    haptics.light();
    fetchEvents();
  }

  if (!isAdmin) {
    return <EmptyState icon={<CalendarDays className="text-noir-500" size={32} />} title="Admin access required" />;
  }

  // Stats
  const activeCount = events.filter((e) => e.is_active).length;
  const upcomingCount = events.filter((e) => e.event_date && !isPast(new Date(e.event_date))).length;

  return (
    <div className="px-4 pt-6 pb-4">
      <PageHeader
        title="Events"
        subtitle={`${activeCount} active · ${upcomingCount} upcoming`}
        action={
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={handleAdd}>
            New Event
          </Button>
        }
      />

      {/* Event list */}
      {!loading && events.length === 0 && (
        <EmptyState
          icon={<CalendarDays className="text-noir-500" size={32} />}
          title="No events yet"
          description="Create your first event to get started"
          action={<Button variant="primary" size="sm" onClick={handleAdd}>Create Event</Button>}
        />
      )}

      <div className="space-y-2">
        {events.map((event) => {
          const d = event.event_date ? new Date(event.event_date) : null;
          const past = d ? isPast(d) : false;

          return (
            <motion.div
              key={event.id}
              layout
              className={`glass rounded-xl p-3 ${!event.is_active ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-sm text-white truncate">{event.title}</h3>
                    {past && <Badge variant="gray" size="sm">Past</Badge>}
                    {!past && event.is_active && <Badge variant="green" size="sm" dot>Live</Badge>}
                  </div>
                  <p className="font-sans text-xs text-noir-400 mt-0.5">
                    {d ? format(d, 'MMM d, yyyy · h:mm a') : 'No date set'}
                    {event.seats_remaining !== null && ` · ${event.seats_remaining} seats left`}
                  </p>
                </div>
                <div className="flex items-center gap-0.5">
                  <button onClick={() => toggleActive(event.id, event.is_active)} className="p-2 text-noir-400 hover:text-champagne-500">
                    {event.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => handleEdit(event)} className="p-2 text-noir-400 hover:text-champagne-500">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => setDeleteTarget(event.id)} className="p-2 text-noir-400 hover:text-rose-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Event' : 'Create Event'} size="md">
        <form onSubmit={handleSave} className="space-y-3">
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title *" required className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-2.5 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description..." rows={3} className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-2.5 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500 resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-sans text-noir-400 mb-1 block">Date</label>
              <input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-2.5 text-white font-sans text-sm focus:outline-none focus:border-champagne-500" />
            </div>
            <div>
              <label className="text-xs font-sans text-noir-400 mb-1 block">Time</label>
              <input type="time" value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-2.5 text-white font-sans text-sm focus:outline-none focus:border-champagne-500" />
            </div>
          </div>
          <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-2.5 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500" />
          <input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="Image URL (optional)" className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-2.5 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500" />
          <div className="grid grid-cols-3 gap-3">
            <input type="number" value={form.max_seats} onChange={(e) => setForm({ ...form, max_seats: e.target.value })} placeholder="Seats" className="bg-noir-800 border border-noir-700 rounded-lg px-3 py-2.5 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500" />
            <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price $" className="bg-noir-800 border border-noir-700 rounded-lg px-3 py-2.5 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500" />
            <select value={form.min_tier} onChange={(e) => setForm({ ...form, min_tier: e.target.value })} className="bg-noir-800 border border-noir-700 rounded-lg px-3 py-2.5 text-white font-sans text-sm focus:outline-none focus:border-champagne-500">
              <option value="flute">All Tiers</option>
              <option value="magnum">Magnum+</option>
              <option value="jeroboam">Jeroboam</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="accent-champagne-500" />
            <span className="font-sans text-sm text-noir-300">Active (visible to members)</span>
          </label>
          <Button variant="primary" size="full" loading={saving} icon={<Save size={14} />} type="submit">
            {editingId ? 'Update Event' : 'Create Event'}
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Event?"
        message="This event and all its bookings will be permanently removed."
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
