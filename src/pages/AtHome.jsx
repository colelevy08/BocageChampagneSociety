/**
 * @file src/pages/AtHome.jsx
 * @description "At Home With Bocage" booking page with service tier selection,
 * testimonials carousel, FAQ accordion, animated booking form, and toast feedback.
 * @importedBy src/App.jsx (route: /at-home)
 * @imports src/lib/supabase.js, src/context/AuthContext.jsx, src/components/ui/*,
 *          src/hooks/*, framer-motion, lucide-react
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, PartyPopper, Gem, CalendarDays, Users, MapPin, Check,
  ChevronDown, Star, Quote, ArrowRight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { useHaptics } from '../hooks/useHaptics';

/** Service tier configuration with detailed info */
const SERVICE_TIERS = [
  {
    id: 'sparkle-serve',
    name: 'Sparkle & Serve',
    icon: Sparkles,
    price: 250,
    priceLabel: 'From $250',
    tagline: 'For intimate gatherings',
    description: 'A curated champagne service for intimate gatherings. Our team brings the Bocage touch to your home with a refined selection.',
    features: [
      'Curated selection of 3 champagnes',
      'Professional champagne service',
      'Glassware & setup provided',
      'Up to 10 guests',
      '2-hour experience',
    ],
    maxGuests: 10,
    color: 'champagne-500',
  },
  {
    id: 'celebrate-home',
    name: 'Celebrate at Home',
    icon: PartyPopper,
    price: 500,
    priceLabel: 'From $500',
    tagline: 'For memorable celebrations',
    description: 'An elevated champagne experience complete with sommelier-guided tasting and artisanal food pairings.',
    features: [
      'Premium selection of 5 champagnes',
      'Sommelier-guided tasting',
      'Artisanal food pairings',
      'Full setup & cleanup',
      'Up to 20 guests',
      '3-hour experience',
    ],
    maxGuests: 20,
    color: 'champagne-400',
  },
  {
    id: 'signature',
    name: 'Signature Bocage',
    icon: Gem,
    price: 1000,
    priceLabel: 'From $1,000',
    tagline: 'The ultimate experience',
    description: 'Bespoke luxury. Rare vintages, private chef, custom décor — an unforgettable evening crafted exclusively for you.',
    features: [
      'Rare & vintage champagne selection',
      'Personal sommelier for the evening',
      'Luxury food pairings by private chef',
      'Custom décor & ambiance',
      'Unlimited guest count',
      'Full concierge service',
      '4+ hour experience',
    ],
    maxGuests: 100,
    color: 'rose-400',
  },
];

/** Testimonials */
const TESTIMONIALS = [
  { text: "The Signature experience was absolutely magical. Our guests are still talking about it months later.", author: "Sarah K.", tier: "Signature" },
  { text: "Perfect for our anniversary. The champagne selection was exquisite and the service was impeccable.", author: "James & Rachel", tier: "Celebrate" },
  { text: "So easy to book and the team made everything effortless. Will definitely do this again!", author: "Emily R.", tier: "Sparkle & Serve" },
];

/** FAQ items */
const FAQS = [
  { q: "How far in advance should I book?", a: "We recommend at least 2 weeks for Sparkle & Serve, 3 weeks for Celebrate at Home, and 4+ weeks for Signature Bocage experiences." },
  { q: "What area do you serve?", a: "We serve the greater Saratoga Springs region, including Saratoga, Albany, and surrounding areas within 30 miles." },
  { q: "Can I customize the champagne selection?", a: "Absolutely! Our sommelier will work with you to curate the perfect selection based on your preferences and the occasion." },
  { q: "What's included in the cleanup?", a: "Our team handles all glassware, setup, and breakdown. You won't have to lift a finger." },
];

/**
 * AtHome page — service tier selection, testimonials, FAQ, and booking form.
 * @returns {JSX.Element}
 */
export default function AtHome() {
  const { user } = useAuth();
  const toast = useToast();
  const haptics = useHaptics();
  const [selectedTier, setSelectedTier] = useState(null);
  const [preferredDate, setPreferredDate] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const selectedService = SERVICE_TIERS.find((s) => s.id === selectedTier);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedTier || !user) return;

    // Validate guest count against tier max
    const guests = parseInt(guestCount, 10);
    if (selectedService && guests > selectedService.maxGuests) {
      toast.warning(`Maximum ${selectedService.maxGuests} guests for ${selectedService.name}.`);
      return;
    }

    setSubmitting(true);
    haptics.medium();

    const { error } = await supabase.from('at_home_bookings').insert({
      user_id: user.id,
      service_tier: selectedTier,
      preferred_date: preferredDate,
      guest_count: guests,
      location,
      notes: notes || null,
    });

    if (error) {
      toast.error('Failed to submit booking. Please try again.');
      haptics.error();
    } else {
      setSuccess(true);
      toast.success('Booking request submitted! We\'ll be in touch.');
      haptics.success();
    }
    setSubmitting(false);
  }

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
      <PageHeader title="At Home" subtitle="With Bocage" />

      {/* Hero intro */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <p className="font-serif text-lg text-noir-200 leading-relaxed">
          Bring the Bocage experience to your home. Select a service tier and we'll craft
          an unforgettable champagne moment.
        </p>
      </motion.div>

      {/* Success state */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass rounded-2xl p-8 text-center border border-champagne-500/30 glow-gold mb-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-16 h-16 rounded-full bg-champagne-500/10 flex items-center justify-center mx-auto mb-4"
            >
              <Check className="text-champagne-500" size={32} />
            </motion.div>
            <h3 className="font-display text-2xl text-white mb-2">Request Submitted</h3>
            <p className="font-serif text-noir-300 mb-6">
              Our team will contact you within 24 hours to finalize your {selectedService?.name} experience.
            </p>
            <Button variant="secondary" onClick={resetForm}>
              Book Another Experience
            </Button>
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.12 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedTier(isSelected ? null : service.id);
                    haptics.selection();
                  }}
                  className={`w-full text-left glass rounded-2xl overflow-hidden border transition-all ${
                    isSelected ? 'border-champagne-500/50 glow-gold' : 'border-transparent hover-lift'
                  }`}
                >
                  {/* Card header with gradient */}
                  <div className={`px-5 pt-5 pb-3 ${isSelected ? 'bg-champagne-500/5' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-${service.color}/10 flex items-center justify-center`}>
                          <Icon className={`text-${service.color}`} size={20} />
                        </div>
                        <div>
                          <h3 className="font-display text-lg text-white">{service.name}</h3>
                          <p className="font-sans text-xs text-noir-400">{service.tagline}</p>
                        </div>
                      </div>
                      <span className="font-display text-lg text-champagne-400">
                        {service.priceLabel}
                      </span>
                    </div>
                    <p className="font-serif text-sm text-noir-300">{service.description}</p>
                  </div>

                  {/* Expandable features */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-2 border-t border-noir-700/50">
                          <p className="font-sans text-xs text-noir-400 uppercase tracking-wider mb-2">Includes</p>
                          <ul className="space-y-1.5">
                            {service.features.map((feature) => (
                              <li key={feature} className="flex items-center gap-2 text-sm font-sans text-noir-200">
                                <Check size={12} className="text-champagne-500 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>

          {/* Booking form */}
          <AnimatePresence>
            {selectedTier && (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                onSubmit={handleSubmit}
                className="space-y-4 mb-8"
              >
                <h3 className="font-display text-xl text-white flex items-center gap-2">
                  <ArrowRight size={18} className="text-champagne-500" />
                  Request Your {selectedService?.name}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-sans text-noir-300 mb-1.5 uppercase tracking-wider">
                      <CalendarDays size={12} /> Date
                    </label>
                    <input
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-3 text-white font-sans text-sm focus:outline-none focus:border-champagne-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-sans text-noir-300 mb-1.5 uppercase tracking-wider">
                      <Users size={12} /> Guests
                    </label>
                    <input
                      type="number"
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                      min="1"
                      max={selectedService?.maxGuests || 100}
                      required
                      placeholder={`Max ${selectedService?.maxGuests || 100}`}
                      className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-3 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500 transition-colors"
                    />
                  </div>
                </div>

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
                    className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-3 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-sans text-noir-300 mb-1.5 uppercase tracking-wider block">
                    Special Requests
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Allergies, occasion, preferences..."
                    className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-3 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500 transition-colors resize-none"
                  />
                </div>

                <Button variant="primary" size="full" loading={submitting} type="submit">
                  Submit Request
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Testimonials */}
          <div className="mb-8">
            <h3 className="font-display text-xl text-white mb-4 flex items-center gap-2">
              <Quote size={18} className="text-champagne-500" />
              What Our Guests Say
            </h3>
            <div className="space-y-3">
              {TESTIMONIALS.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="glass rounded-xl p-4"
                >
                  <p className="font-serif text-sm text-noir-200 italic mb-2">"{t.text}"</p>
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-xs text-champagne-500">{t.author}</span>
                    <span className="font-sans text-xs text-noir-500">{t.tier}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h3 className="font-display text-xl text-white mb-4">Common Questions</h3>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 + i * 0.05 }}
                  className="glass rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <span className="font-sans text-sm text-white pr-4">{faq.q}</span>
                    <ChevronDown
                      size={16}
                      className={`text-noir-400 flex-shrink-0 transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <AnimatePresence>
                    {expandedFaq === i && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="font-serif text-sm text-noir-300 px-4 pb-4">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
