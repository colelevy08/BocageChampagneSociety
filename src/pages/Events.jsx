/**
 * @file src/pages/Events.jsx
 * @description Events listing page for Bocage Champagne Society.
 * Displays upcoming events with tier-gating, seat tracking, and RSVP booking.
 * Members can only book events matching their tier or below.
 * @importedBy src/App.jsx (route: /events)
 * @imports src/lib/supabase.js, src/context/AuthContext.jsx, framer-motion, lucide-react, date-fns
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, MapPin, Users, Lock, Check } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/** Tier hierarchy for gating logic — higher index = higher tier */
const TIER_ORDER = ['flute', 'magnum', 'jeroboam'];

/**
 * Events page component — lists upcoming events with booking functionality.
 * Tier-gated events show a lock icon if the user's tier is too low.
 * Already-booked events show a confirmation badge.
 *
 * @returns {JSX.Element}
 */
export default function Events() {
  const { user, tier } = useAuth();
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState(null);

  const userTierIndex = TIER_ORDER.indexOf(tier?.slug || 'flute');

  // Fetch events and user's bookings on mount
  useEffect(() => {
    fetchData();
  }, [user]);

  /**
   * Fetches active events and the current user's bookings in parallel.
   */
  async function fetchData() {
    setLoading(true);
    const [eventsRes, bookingsRes] = await Promise.all([
      supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .gte('event_date', new Date().toISOString())
        .order('event_date'),
      user
        ? supabase
            .from('event_bookings')
            .select('event_id')
            .eq('user_id', user.id)
        : Promise.resolve({ data: [] }),
    ]);

    if (eventsRes.data) setEvents(eventsRes.data);
    if (bookingsRes.data) setBookings(bookingsRes.data.map((b) => b.event_id));
    setLoading(false);
  }

  /**
   * Books the current user into an event.
   * Inserts a booking row and decrements seats_remaining.
   * @param {string} eventId - UUID of the event to book
   */
  async function handleBook(eventId) {
    if (!user) return;
    setBookingId(eventId);

    const { error } = await supabase
      .from('event_bookings')
      .insert({ user_id: user.id, event_id: eventId });

    if (!error) {
      // Decrement seats remaining
      await supabase.rpc('decrement_seats', { event_id: eventId }).catch(() => {
        // Fallback: manual decrement if RPC doesn't exist
        const event = events.find((e) => e.id === eventId);
        if (event) {
          supabase
            .from('events')
            .update({ seats_remaining: event.seats_remaining - 1 })
            .eq('id', eventId);
        }
      });
      setBookings([...bookings, eventId]);
      // Refresh to get updated seat counts
      fetchData();
    }

    setBookingId(null);
  }

  /**
   * Checks if the user meets the minimum tier requirement for an event.
   * @param {string} minTier - The event's minimum tier slug
   * @returns {boolean} True if the user's tier is sufficient
   */
  function meetsMinTier(minTier) {
    const requiredIndex = TIER_ORDER.indexOf(minTier || 'flute');
    return userTierIndex >= requiredIndex;
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl text-gradient-gold">Events</h1>
        <p className="font-serif text-noir-300 mt-1">Upcoming Experiences</p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-champagne-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && events.length === 0 && (
        <div className="text-center py-20">
          <CalendarDays className="mx-auto text-noir-600 mb-3" size={48} />
          <p className="font-serif text-noir-400">No upcoming events</p>
          <p className="font-sans text-xs text-noir-500 mt-1">Check back soon for new experiences</p>
        </div>
      )}

      {/* Event cards */}
      <div className="space-y-4">
        {events.map((event, index) => {
          const isBooked = bookings.includes(event.id);
          const hasAccess = meetsMinTier(event.min_tier);
          const isFull = event.seats_remaining !== null && event.seats_remaining <= 0;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="glass rounded-2xl overflow-hidden"
            >
              {/* Event image */}
              {event.image_url && (
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-40 object-cover"
                />
              )}

              <div className="p-4">
                {/* Title + tier badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display text-lg text-white">{event.title}</h3>
                  {event.min_tier !== 'flute' && (
                    <span className="text-xs font-sans bg-champagne-500/20 text-champagne-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {event.min_tier?.charAt(0).toUpperCase() + event.min_tier?.slice(1)}+
                    </span>
                  )}
                </div>

                {/* Description */}
                {event.description && (
                  <p className="font-serif text-sm text-noir-300 mb-3 line-clamp-2">
                    {event.description}
                  </p>
                )}

                {/* Meta info */}
                <div className="flex flex-wrap gap-3 text-xs font-sans text-noir-400 mb-4">
                  <span className="flex items-center gap-1">
                    <CalendarDays size={14} />
                    {format(new Date(event.event_date), 'MMM d, yyyy · h:mm a')}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {event.location || 'Bocage'}
                  </span>
                  {event.seats_remaining !== null && (
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {event.seats_remaining} seats left
                    </span>
                  )}
                </div>

                {/* Pricing + action */}
                <div className="flex items-center justify-between">
                  {event.price ? (
                    <span className="font-sans text-champagne-500 font-medium">
                      ${Number(event.price).toFixed(0)}
                    </span>
                  ) : (
                    <span className="font-sans text-champagne-500 font-medium">Free</span>
                  )}

                  {isBooked ? (
                    <span className="flex items-center gap-1 text-sm font-sans text-champagne-500">
                      <Check size={16} /> Booked
                    </span>
                  ) : !hasAccess ? (
                    <span className="flex items-center gap-1 text-sm font-sans text-noir-500">
                      <Lock size={16} /> Upgrade Tier
                    </span>
                  ) : isFull ? (
                    <span className="text-sm font-sans text-noir-500">Sold Out</span>
                  ) : (
                    <button
                      onClick={() => handleBook(event.id)}
                      disabled={bookingId === event.id}
                      className="bg-champagne-500 text-noir-900 font-sans font-medium text-sm px-4 py-2 rounded-lg shimmer-gold hover:bg-champagne-400 transition-colors disabled:opacity-50"
                    >
                      {bookingId === event.id ? 'Booking...' : 'RSVP'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
