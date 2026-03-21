/**
 * @file src/pages/Events.jsx
 * @description Events listing page with tier-gating, countdown timers,
 * seat tracking, booking with toast feedback, skeleton loading,
 * pull-to-refresh, and share functionality.
 * @importedBy src/App.jsx (route: /events)
 * @imports src/lib/supabase.js, src/context/AuthContext.jsx, src/components/ui/*,
 *          src/hooks/*, framer-motion, lucide-react, date-fns
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, MapPin, Users, Lock, Check, Clock, Share2, RefreshCw, Ticket } from 'lucide-react';
import { format, formatDistanceToNow, isPast, differenceInDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { EventCardSkeleton } from '../components/ui/Skeleton';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useHaptics } from '../hooks/useHaptics';

const TIER_ORDER = ['flute', 'magnum', 'jeroboam'];

/**
 * Events page — upcoming events with booking, tier-gating, countdowns, and sharing.
 * @returns {JSX.Element}
 */
export default function Events() {
  const { user, tier } = useAuth();
  const toast = useToast();
  const haptics = useHaptics();
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState(null);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming' | 'free' | 'premium'

  const userTierIndex = TIER_ORDER.indexOf(tier?.slug || 'flute');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [eventsRes, bookingsRes] = await Promise.all([
      supabase.from('events').select('*').eq('is_active', true).order('event_date'),
      user
        ? supabase.from('event_bookings').select('event_id').eq('user_id', user.id)
        : Promise.resolve({ data: [] }),
    ]);
    if (eventsRes.data) setEvents(eventsRes.data);
    if (bookingsRes.data) setBookings(bookingsRes.data.map((b) => b.event_id));
    setLoading(false);
  }, [user]);

  const { isRefreshing, pullDistance } = usePullToRefresh(fetchData);
  useEffect(() => { fetchData(); }, [fetchData]);

  /** Books the user into an event with toast feedback */
  async function handleBook(eventId) {
    if (!user) return;
    setBookingId(eventId);
    haptics.medium();

    const { error } = await supabase
      .from('event_bookings')
      .insert({ user_id: user.id, event_id: eventId });

    if (error) {
      toast.error('Booking failed. Please try again.');
      haptics.error();
    } else {
      // Decrement seats
      const event = events.find((e) => e.id === eventId);
      if (event?.seats_remaining) {
        await supabase.from('events')
          .update({ seats_remaining: event.seats_remaining - 1 })
          .eq('id', eventId);
      }
      setBookings([...bookings, eventId]);
      toast.success('You\'re in! See you there.');
      haptics.success();
      fetchData();
    }
    setBookingId(null);
  }

  /** Checks if user meets tier requirement */
  function meetsMinTier(minTier) {
    return userTierIndex >= TIER_ORDER.indexOf(minTier || 'flute');
  }

  /** Shares an event using the Web Share API */
  async function shareEvent(event) {
    const text = `${event.title} at Bocage — ${format(new Date(event.event_date), 'MMM d, yyyy')}`;
    if (navigator.share) {
      await navigator.share({ title: event.title, text }).catch(() => {});
    }
  }

  // Filter events
  const upcomingEvents = events.filter((e) => !isPast(new Date(e.event_date)));
  const filtered = upcomingEvents.filter((event) => {
    if (filter === 'free') return !event.price || Number(event.price) === 0;
    if (filter === 'premium') return event.min_tier !== 'flute';
    return true;
  });

  const bookedCount = upcomingEvents.filter((e) => bookings.includes(e.id)).length;

  return (
    <div className="px-4 pt-6 pb-4">
      {pullDistance > 0 && (
        <div className="flex justify-center -mt-4 mb-2">
          <RefreshCw size={20} className={`text-champagne-500 ${isRefreshing ? 'animate-spin' : ''}`} />
        </div>
      )}

      <PageHeader
        title="Events"
        subtitle={`${upcomingEvents.length} upcoming · ${bookedCount} booked`}
      />

      {/* Filter chips */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'upcoming', label: 'All' },
          { key: 'free', label: 'Free' },
          { key: 'premium', label: 'Premium' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-sans transition-all ${
              filter === key
                ? 'bg-champagne-500 text-noir-900 font-medium'
                : 'bg-noir-800 text-noir-300 border border-noir-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <EventCardSkeleton key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={<CalendarDays className="text-noir-500" size={32} />}
          title="No upcoming events"
          description="Check back soon for new experiences at Bocage"
        />
      )}

      {/* Event cards */}
      <div className="space-y-4">
        {filtered.map((event, index) => {
          const isBooked = bookings.includes(event.id);
          const hasAccess = meetsMinTier(event.min_tier);
          const isFull = event.seats_remaining !== null && event.seats_remaining <= 0;
          const eventDate = new Date(event.event_date);
          const daysUntil = differenceInDays(eventDate, new Date());
          const isToday = daysUntil === 0;
          const isSoon = daysUntil <= 3;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="glass rounded-2xl overflow-hidden hover-lift"
            >
              {/* Event image with overlay */}
              {event.image_url && (
                <div className="relative">
                  <img src={event.image_url} alt={event.title} className="w-full h-44 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-noir-900/80 via-transparent to-transparent" />
                  {/* Countdown badge */}
                  {isSoon && !isPast(eventDate) && (
                    <div className="absolute top-3 right-3">
                      <Badge variant={isToday ? 'red' : 'gold'} dot>
                        {isToday ? 'Today' : `${daysUntil}d left`}
                      </Badge>
                    </div>
                  )}
                  {/* Booked indicator */}
                  {isBooked && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="green" dot>Booked</Badge>
                    </div>
                  )}
                </div>
              )}

              <div className="p-4">
                {/* Title + tier badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display text-lg text-white leading-tight">{event.title}</h3>
                  {event.min_tier !== 'flute' && (
                    <Badge variant="gold">
                      {event.min_tier?.charAt(0).toUpperCase() + event.min_tier?.slice(1)}+
                    </Badge>
                  )}
                </div>

                {event.description && (
                  <p className="font-serif text-sm text-noir-300 mb-3 line-clamp-2">{event.description}</p>
                )}

                {/* Meta info with icons */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs font-sans text-noir-400">
                    <CalendarDays size={14} className="text-champagne-600" />
                    <span>{format(eventDate, 'EEEE, MMM d · h:mm a')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-sans text-noir-400">
                    <MapPin size={14} className="text-champagne-600" />
                    <span>{event.location || 'Bocage Champagne Bar'}</span>
                  </div>
                  {event.seats_remaining !== null && (
                    <div className="flex items-center gap-2 text-xs font-sans text-noir-400">
                      <Users size={14} className="text-champagne-600" />
                      <span>
                        {event.seats_remaining > 0
                          ? `${event.seats_remaining} of ${event.max_seats || '—'} seats left`
                          : 'Sold out'}
                      </span>
                      {/* Seat urgency bar */}
                      {event.max_seats && event.seats_remaining > 0 && (
                        <div className="flex-1 h-1.5 bg-noir-700 rounded-full ml-1">
                          <div
                            className={`h-full rounded-full ${event.seats_remaining <= 5 ? 'bg-rose-500' : 'bg-champagne-500'}`}
                            style={{ width: `${(event.seats_remaining / event.max_seats) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {/* Countdown */}
                  {!isPast(eventDate) && (
                    <div className="flex items-center gap-2 text-xs font-sans text-champagne-400">
                      <Clock size={14} />
                      <span>{formatDistanceToNow(eventDate, { addSuffix: true })}</span>
                    </div>
                  )}
                </div>

                {/* Action row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {event.price ? (
                      <span className="font-display text-xl text-champagne-500">
                        ${Number(event.price).toFixed(0)}
                      </span>
                    ) : (
                      <Badge variant="green">Free</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Share button */}
                    <button
                      onClick={() => shareEvent(event)}
                      className="p-2 text-noir-400 hover:text-champagne-500 transition-colors"
                    >
                      <Share2 size={16} />
                    </button>

                    {/* Action button */}
                    {isBooked ? (
                      <span className="flex items-center gap-1.5 text-sm font-sans text-champagne-500 bg-champagne-500/10 px-3 py-2 rounded-lg">
                        <Check size={14} /> Booked
                      </span>
                    ) : !hasAccess ? (
                      <span className="flex items-center gap-1.5 text-sm font-sans text-noir-500 bg-noir-800 px-3 py-2 rounded-lg">
                        <Lock size={14} /> Upgrade
                      </span>
                    ) : isFull ? (
                      <span className="text-sm font-sans text-noir-500 bg-noir-800 px-3 py-2 rounded-lg">
                        Sold Out
                      </span>
                    ) : (
                      <Button
                        variant="primary"
                        size="md"
                        loading={bookingId === event.id}
                        icon={<Ticket size={14} />}
                        onClick={() => handleBook(event.id)}
                      >
                        RSVP
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
