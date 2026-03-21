/**
 * @file src/components/EventDetailModal.jsx
 * @description Full event detail view in a modal. Shows large image, description,
 * venue info, countdown, pricing, and booking action.
 * @importedBy src/pages/Events.jsx
 * @imports src/components/ui/Modal.jsx, src/components/ui/Badge.jsx, date-fns, lucide-react
 */

import Modal from './ui/Modal';
import Badge from './ui/Badge';
import { CalendarDays, MapPin, Users, Clock, DollarSign } from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';

/**
 * EventDetailModal — full event information in a slide-up modal.
 *
 * @param {object} props
 * @param {object|null} props.event - Event object to display
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close handler
 * @param {boolean} props.isBooked - Whether the user has booked this event
 * @param {boolean} props.hasAccess - Whether user meets tier requirement
 * @param {Function} props.onBook - Book callback
 * @param {boolean} props.bookingLoading - Whether booking is in progress
 * @returns {JSX.Element}
 */
export default function EventDetailModal({
  event,
  isOpen,
  onClose,
  isBooked,
  hasAccess,
  onBook,
  bookingLoading,
}) {
  if (!event) return null;

  const eventDate = new Date(event.event_date);
  const past = isPast(eventDate);
  const isFull = event.seats_remaining !== null && event.seats_remaining <= 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="md" showClose={true}>
      {/* Large image */}
      {event.image_url && (
        <div className="relative -mx-5 -mt-3 mb-4">
          <img src={event.image_url} alt={event.title} className="w-full h-52 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-noir-800 via-transparent to-transparent" />
        </div>
      )}

      {/* Title + badges */}
      <div className="mb-4">
        <div className="flex items-start gap-2 mb-2">
          <h2 className="font-display text-2xl text-white leading-tight flex-1">{event.title}</h2>
          {event.min_tier !== 'flute' && (
            <Badge variant="gold">{event.min_tier?.charAt(0).toUpperCase() + event.min_tier?.slice(1)}+</Badge>
          )}
        </div>
        {isBooked && <Badge variant="green" dot>You're attending</Badge>}
      </div>

      {/* Description */}
      {event.description && (
        <p className="font-serif text-base text-noir-200 leading-relaxed mb-5">
          {event.description}
        </p>
      )}

      {/* Details grid */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 p-3 bg-noir-800 rounded-lg">
          <CalendarDays size={18} className="text-champagne-500 flex-shrink-0" />
          <div>
            <p className="font-sans text-sm text-white">{format(eventDate, 'EEEE, MMMM d, yyyy')}</p>
            <p className="font-sans text-xs text-noir-400">{format(eventDate, 'h:mm a')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-noir-800 rounded-lg">
          <MapPin size={18} className="text-champagne-500 flex-shrink-0" />
          <p className="font-sans text-sm text-white">{event.location || '10 Phila St, Saratoga Springs'}</p>
        </div>

        {event.max_seats && (
          <div className="flex items-center gap-3 p-3 bg-noir-800 rounded-lg">
            <Users size={18} className="text-champagne-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-sans text-sm text-white">
                {event.seats_remaining ?? event.max_seats} of {event.max_seats} seats available
              </p>
              <div className="h-1.5 bg-noir-700 rounded-full mt-1.5">
                <div
                  className={`h-full rounded-full transition-all ${(event.seats_remaining || 0) <= 5 ? 'bg-rose-500' : 'bg-champagne-500'}`}
                  style={{ width: `${((event.seats_remaining || 0) / event.max_seats) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {!past && (
          <div className="flex items-center gap-3 p-3 bg-noir-800 rounded-lg">
            <Clock size={18} className="text-champagne-500 flex-shrink-0" />
            <p className="font-sans text-sm text-champagne-400">
              {formatDistanceToNow(eventDate, { addSuffix: true })}
            </p>
          </div>
        )}
      </div>

      {/* Price + action */}
      <div className="flex items-center justify-between p-4 bg-noir-800 rounded-xl">
        <div>
          <p className="font-sans text-xs text-noir-400">Price</p>
          <p className="font-display text-2xl text-champagne-500">
            {event.price ? `$${Number(event.price).toFixed(0)}` : 'Free'}
          </p>
        </div>

        {isBooked ? (
          <span className="font-sans text-sm text-champagne-500 bg-champagne-500/10 px-4 py-2.5 rounded-lg">
            Booked
          </span>
        ) : !hasAccess ? (
          <span className="font-sans text-sm text-noir-500 bg-noir-700 px-4 py-2.5 rounded-lg">
            Upgrade to Access
          </span>
        ) : isFull ? (
          <span className="font-sans text-sm text-noir-500 bg-noir-700 px-4 py-2.5 rounded-lg">
            Sold Out
          </span>
        ) : past ? (
          <span className="font-sans text-sm text-noir-500 bg-noir-700 px-4 py-2.5 rounded-lg">
            Event Passed
          </span>
        ) : (
          <button
            onClick={() => { onBook(event.id); onClose(); }}
            disabled={bookingLoading}
            className="bg-champagne-500 text-noir-900 font-sans font-semibold px-6 py-2.5 rounded-lg shimmer-gold hover:bg-champagne-400 transition-colors disabled:opacity-50"
          >
            {bookingLoading ? 'Booking...' : 'RSVP Now'}
          </button>
        )}
      </div>
    </Modal>
  );
}
