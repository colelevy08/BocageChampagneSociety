/**
 * @file src/pages/AtHome.jsx
 * @description "At Home With Bocage" booking page for private champagne experiences.
 * Offers three service tiers (Sparkle & Serve, Celebrate at Home, Signature Bocage)
 * with a booking form that writes to the at_home_bookings table.
 * @importedBy src/App.jsx (route: /at-home)
 * @imports src/lib/supabase.js, src/context/AuthContext.jsx, framer-motion, lucide-react
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, PartyPopper, Gem, CalendarDays, Users, MapPin, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/** Service tier configuration */
const SERVICE_TIERS = [
  {
    id: 'sparkle-serve',
    name: 'Sparkle & Serve',
    icon: Sparkles,
    price: 'From $250',
    description: 'A curated champagne service for intimate gatherings of up to 10 guests.',
    features: [
      'Curated selection of 3 champagnes',
      'Professional champagne service',
      'Glassware & setup provided',
      'Up to 10 guests',
    ],
  },
  {
    id: 'celebrate-home',
    name: 'Celebrate at Home',
    icon: PartyPopper,
    price: 'From $500',
    description: 'An elevated champagne experience with food pairings for up to 20 guests.',
    features: [
      'Premium selection of 5 champagnes',
      'Sommelier-guided tasting',
      'Artisanal food pairings',
      'Full setup & cleanup',
      'Up to 20 guests',
    ],
  },
  {
    id: 'signature',
    name: 'Signature Bocage',
    icon: Gem,
    price: 'From $1,000',
    description: 'The ultimate private champagne experience. Bespoke service, rare vintages.',
    features: [
      'Rare & vintage champagne selection',
      'Personal sommelier for the evening',
      'Luxury food pairings by private chef',
      'Custom décor & ambiance',
      'Unlimited guest count',
      'Full concierge service',
    ],
  },
];

/**
 * AtHome page component — service tier selection + booking form.
 *
 * @returns {JSX.Element}
 */
export default function AtHome() {
  const { user } = useAuth();
  const [selectedTier, setSelectedTier] = useState(null);
  const [preferredDate, setPreferredDate] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  /**
   * Submits the at-home booking request to Supabase.
   * @param {React.FormEvent} e
   */
  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedTier || !user) return;

    setSubmitting(true);
    setError('');

    const { error: insertError } = await supabase
      .from('at_home_bookings')
      .insert({
        user_id: user.id,
        service_tier: selectedTier,
        preferred_date: preferredDate,
        guest_count: parseInt(guestCount, 10),
        location,
        notes: notes || null,
      });

    if (insertError) {
      setError('Failed to submit booking. Please try again.');
    } else {
      setSuccess(true);
    }
    setSubmitting(false);
  }

  /**
   * Resets the form after a successful booking for a new request.
   */
  function resetForm() {
    setSelectedTier(null);
    setPreferredDate('');
    setGuestCount('');
    setLocation('');
    setNotes('');
    setSuccess(false);
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl text-gradient-gold">At Home</h1>
        <p className="font-serif text-noir-300 mt-1">With Bocage</p>
      </div>

      <p className="font-serif text-noir-200 mb-6">
        Bring the Bocage experience to your home. Select a service tier and we'll craft
        an unforgettable champagne moment for you and your guests.
      </p>

      {/* Success state */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass rounded-2xl p-6 text-center border border-champagne-500/30"
          >
            <div className="w-14 h-14 rounded-full bg-champagne-500/10 flex items-center justify-center mx-auto mb-4">
              <Check className="text-champagne-500" size={28} />
            </div>
            <h3 className="font-display text-xl text-white mb-2">Request Submitted</h3>
            <p className="font-serif text-noir-300 mb-4">
              Our team will be in touch within 24 hours to finalize your experience.
            </p>
            <button
              onClick={resetForm}
              className="font-sans text-sm text-champagne-500 underline"
            >
              Book another experience
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!success && (
        <>
          {/* Service tier cards */}
          <div className="space-y-4 mb-8">
            {SERVICE_TIERS.map((service, index) => {
              const Icon = service.icon;
              const isSelected = selectedTier === service.id;

              return (
                <motion.button
                  key={service.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedTier(service.id)}
                  className={`w-full text-left glass rounded-2xl p-5 border transition-colors ${
                    isSelected
                      ? 'border-champagne-500/50'
                      : 'border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="text-champagne-500" size={22} />
                    <h3 className="font-display text-lg text-white">{service.name}</h3>
                    <span className="ml-auto font-sans text-sm text-champagne-400">
                      {service.price}
                    </span>
                  </div>
                  <p className="font-serif text-sm text-noir-300 mb-3">{service.description}</p>
                  <ul className="space-y-1">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-xs font-sans text-noir-400">
                        <Sparkles size={10} className="text-champagne-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.button>
              );
            })}
          </div>

          {/* Booking form — shown when a tier is selected */}
          <AnimatePresence>
            {selectedTier && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <h3 className="font-display text-xl text-white">Request Booking</h3>

                {/* Preferred date */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-sans text-noir-300 mb-1.5 uppercase tracking-wider">
                    <CalendarDays size={12} /> Preferred Date
                  </label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    required
                    className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-3 text-white font-sans focus:outline-none focus:border-champagne-500 transition-colors"
                  />
                </div>

                {/* Guest count */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-sans text-noir-300 mb-1.5 uppercase tracking-wider">
                    <Users size={12} /> Number of Guests
                  </label>
                  <input
                    type="number"
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    min="1"
                    max="100"
                    required
                    placeholder="10"
                    className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-3 text-white font-sans placeholder:text-noir-500 focus:outline-none focus:border-champagne-500 transition-colors"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-sans text-noir-300 mb-1.5 uppercase tracking-wider">
                    <MapPin size={12} /> Your Address
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    placeholder="123 Broadway, Saratoga Springs, NY"
                    className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-3 text-white font-sans placeholder:text-noir-500 focus:outline-none focus:border-champagne-500 transition-colors"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-sans text-noir-300 mb-1.5 uppercase tracking-wider block">
                    Special Requests (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Allergies, themes, special occasions..."
                    className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-3 text-white font-sans placeholder:text-noir-500 focus:outline-none focus:border-champagne-500 transition-colors resize-none"
                  />
                </div>

                {/* Error */}
                {error && <p className="text-rose-500 text-sm font-sans">{error}</p>}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-champagne-500 text-noir-900 font-sans font-semibold py-3.5 rounded-lg shimmer-gold hover:bg-champagne-400 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
