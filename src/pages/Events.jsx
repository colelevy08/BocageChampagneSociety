/**
 * @file src/pages/Events.jsx
 * @description Events listing page with compact cards, free/paid filter, booking
 * with toast feedback, skeleton loading, pull-to-refresh, and expandable detail.
 * Society uses a single membership product, so events are open to all members
 * (no tier-gating).
 * @importedBy src/App.jsx (route: /events)
 * @imports src/lib/supabase.js, src/context/AuthContext.jsx, src/components/ui/*,
 *          src/hooks/*, framer-motion, lucide-react, date-fns
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, MapPin, Users, Check, Clock, Share2, RefreshCw, Ticket, ChevronDown } from 'lucide-react';
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

/**
 * Events page — upcoming events with compact cards, expandable detail, and booking.
 * @returns {JSX.Element}
 */
export default function Events() {
  const { user } = useAuth();
  const toast = useToast();
  const haptics = useHaptics();
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState(null);
  const [filter, setFilter] = useState('upcoming');
  const [expandedId, setExpandedId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [eventsRes, bookingsRes] = await Promise.all([
      supabase.from('bocage_events').select('*').eq('is_active', true).order('event_date'),
      user
        ? supabase.from('bocage_event_bookings').select('event_id').eq('user_id', user.id)
        : Promise.resolve({ data: [] }),
    ]);
    if (eventsRes.data) setEvents(eventsRes.data);
    if (bookingsRes.data) setBookings(bookingsRes.data.map((b) => b.event_id));
    setLoading(false);
  }, [user]);

  const { isRefreshing, pullDistance } = usePullToRefresh(fetchData);
  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleBook(eventId) {
    if (!user) return;
    setBookingId(eventId);
    haptics.medium();

    const { error } = await supabase
      .from('bocage_event_bookings')
      .insert({ user_id: user.id, event_id: eventId });

    if (error) {
      toast.error('Booking failed. Please try again.');
      haptics.error();
    } else {
      const event = events.find((e) => e.id === eventId);
      if (event?.seats_remaining) {
        await supabase.from('bocage_events')
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

  async function shareEvent(event) {
    const text = `${event.title} at Bocage — ${format(new Date(event.event_date), 'MMM d, yyyy')}`;
    if (navigator.share) {
      await navigator.share({ title: event.title, text }).catch(() => {});
    }
  }

  const upcomingEvents = events.filter((e) => !isPast(new Date(e.event_date)));
  const filtered = upcomingEvents.filter((event) => {
    if (filter === 'free') return !event.price || Number(event.price) === 0;
    if (filter === 'paid') return event.price && Number(event.price) > 0;
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
          { key: 'paid', label: 'Paid' },
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
        <div className="space-y-3">
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

      {/* Compact event cards */}
      <div className="space-y-3">
        {filtered.map((event, index) => {
          const isBooked = bookings.includes(event.id);
          const isFull = event.seats_remaining !== null && event.seats_remaining <= 0;
          const eventDate = new Date(event.event_date);
          const daysUntil = differenceInDays(eventDate, new Date());
          const isToday = daysUntil === 0;
          const isSoon = daysUntil <= 3;
          const isExpanded = expandedId === event.id;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-2xl overflow-hidden"
            >
              {/* Compact card — tap to expand */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : event.id)}
                className="w-full text-left"
              >
                <div className="flex">
                  {/* Thumbnail or date block */}
                  {event.image_url ? (
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                      {isBooked && (
                        <div className="absolute top-1.5 left-1.5">
                          <Check size={14} className="text-emerald-400 bg-noir-900/70 rounded-full p-0.5" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-noir-700 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="font-display text-2xl text-champagne-500">{format(eventDate, 'd')}</span>
                      <span className="font-sans text-xs text-noir-400 uppercase">{format(eventDate, 'MMM')}</span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 p-3 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-base text-white leading-tight line-clamp-1">{event.title}</h3>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isSoon && !isPast(eventDate) && (
                            <Badge variant={isToday ? 'red' : 'gray'} size="sm">
                              {isToday ? 'Today' : `${daysUntil}d`}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="font-sans text-xs text-noir-400 mt-0.5">
                        {format(eventDate, 'EEE, MMM d · h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-2">
                        {event.price ? (
                          <span className="font-display text-lg text-champagne-500">
                            ${Number(event.price).toFixed(0)}
                          </span>
                        ) : (
                          <Badge variant="green" size="sm">Free</Badge>
                        )}
                        {event.seats_remaining !== null && event.seats_remaining > 0 && event.seats_remaining <= 10 && (
                          <span className="font-sans text-xs text-rose-400">{event.seats_remaining} left</span>
                        )}
                      </div>
                      <ChevronDown
                        size={14}
                        className={`text-noir-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 border-t border-noir-700/50">
                      {event.description && (
                        <p className="font-serif text-sm text-noir-300 mb-3">{event.description}</p>
                      )}

                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-2 text-xs font-sans text-noir-400">
                          <MapPin size={13} className="text-champagne-600" />
                          <span>{event.location || 'Bocage Champagne Bar'}</span>
                        </div>
                        {event.seats_remaining !== null && (
                          <div className="flex items-center gap-2 text-xs font-sans text-noir-400">
                            <Users size={13} className="text-champagne-600" />
                            <span>
                              {event.seats_remaining > 0
                                ? `${event.seats_remaining} of ${event.max_seats || '—'} seats left`
                                : 'Sold out'}
                            </span>
                            {event.max_seats && event.seats_remaining > 0 && (
                              <div className="flex-1 h-1 bg-noir-700 rounded-full ml-1">
                                <div
                                  className={`h-full rounded-full ${event.seats_remaining <= 5 ? 'bg-rose-500' : 'bg-champagne-500'}`}
                                  style={{ width: `${(event.seats_remaining / event.max_seats) * 100}%` }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                        {!isPast(eventDate) && (
                          <div className="flex items-center gap-2 text-xs font-sans text-champagne-400">
                            <Clock size={13} />
                            <span>{formatDistanceToNow(eventDate, { addSuffix: true })}</span>
                          </div>
                        )}
                      </div>

                      {/* Action row */}
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); shareEvent(event); }}
                          className="p-2 text-noir-400 hover:text-champagne-500 transition-colors"
                        >
                          <Share2 size={15} />
                        </button>

                        {isBooked ? (
                          <span className="flex items-center gap-1.5 text-sm font-sans text-champagne-500 bg-champagne-500/10 px-3 py-1.5 rounded-lg">
                            <Check size={14} /> Booked
                          </span>
                        ) : isFull ? (
                          <span className="text-sm font-sans text-noir-500 bg-noir-800 px-3 py-1.5 rounded-lg">
                            Sold Out
                          </span>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            loading={bookingId === event.id}
                            icon={<Ticket size={14} />}
                            onClick={(e) => { e.stopPropagation(); handleBook(event.id); }}
                          >
                            RSVP
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
