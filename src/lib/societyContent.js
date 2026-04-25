/**
 * @file src/lib/societyContent.js
 * @description Shared content blocks shown on Society member pages — benefits,
 * testimonials, and FAQs. Stored in bocage_site_data.data.society as JSON so
 * admins can edit them via AdminCRM, with hardcoded defaults as fallbacks.
 *
 * Icons in the benefits list are stored as Lucide component names (e.g. "Wine")
 * and resolved against ICON_MAP at render time.
 *
 * @importedBy src/pages/Membership.jsx, src/pages/Profile.jsx,
 *             src/pages/AtHome.jsx, src/pages/AdminCRM.jsx
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Wine, CalendarHeart, Sparkles, Gift, Users, Crown, Shield, Star,
  Award, Heart, Flame, MapPin, Calendar, Mail, Phone, Wallet, Trophy,
  PartyPopper, Gem, Music, GlassWater, Cake, Bell,
} from 'lucide-react';
import { supabase } from './supabase';

/** Icon strings that admins can pick from when editing a benefit or tier.
    Render code looks each one up in this map; unknown names fall back to
    Sparkles. */
export const ICON_MAP = {
  Wine, CalendarHeart, Sparkles, Gift, Users, Crown, Shield, Star,
  Award, Heart, Flame, MapPin, Calendar, Mail, Phone, Wallet, Trophy,
  PartyPopper, Gem, Music, GlassWater, Cake, Bell,
};
export const ICON_NAMES = Object.keys(ICON_MAP);

/** Resolve an icon name to its Lucide component, defaulting to Sparkles. */
export function iconForName(name) {
  return ICON_MAP[name] || Sparkles;
}

/** Default benefits — used when bocage_site_data.data.society.benefits is missing. */
export const DEFAULT_BENEFITS = [
  { icon: 'Wine',          title: 'Member pours',   body: 'Access to allocations and rare bottles reserved for the Society — never on the public list.' },
  { icon: 'CalendarHeart', title: 'Private events', body: 'First seat at producer dinners, library tastings, and seasonal Society nights.' },
  { icon: 'Sparkles',      title: 'Birthday toast', body: 'A complimentary glass of champagne to mark your birthday with us.' },
  { icon: 'Gift',          title: 'Early access',   body: 'New arrivals, vintage releases, and At-Home dates open to members first.' },
  { icon: 'Users',         title: 'Bring a guest',  body: 'Member-rate guest passes for Society events when you reserve in advance.' },
];

/** Default testimonials — used when bocage_site_data.data.society.testimonials is missing. */
export const DEFAULT_TESTIMONIALS = [
  { text: "The Signature experience was absolutely magical. Our guests are still talking about it months later.", author: "Sarah K.",        tier: "Signature" },
  { text: "Perfect for our anniversary. The champagne selection was exquisite and the service was impeccable.",  author: "James & Rachel",  tier: "Celebrate" },
  { text: "So easy to book and the team made everything effortless. Will definitely do this again!",              author: "Emily R.",        tier: "Sparkle & Serve" },
];

/** Default FAQs — used when bocage_site_data.data.society.faqs is missing. */
export const DEFAULT_FAQS = [
  { q: "How far in advance should I book?",       a: "We recommend at least 2 weeks for Sparkle & Serve, 3 weeks for Celebrate at Home, and 4+ weeks for Signature Bocage experiences." },
  { q: "What area do you serve?",                  a: "We serve the greater Saratoga Springs region, including Saratoga, Albany, and surrounding areas within 30 miles." },
  { q: "Can I customize the champagne selection?", a: "Absolutely! Our sommelier will work with you to curate the perfect selection based on your preferences and the occasion." },
  { q: "What's included in the cleanup?",          a: "Our team handles all glassware, setup, and breakdown. You won't have to lift a finger." },
];

/** Default At-Home service tiers. The tier `id` is what's persisted in the
    bocage_at_home_bookings.service_tier column when a member books, so the
    Content tab in CRM treats `id` as immutable on existing tiers — admins
    can change everything else. */
export const DEFAULT_SERVICE_TIERS = [
  {
    id: 'sparkle-serve',
    name: 'Sparkle & Serve',
    icon: 'Sparkles',
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
    icon: 'PartyPopper',
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
    icon: 'Gem',
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

/** Tailwind color tokens admins can pick from when styling a tier. */
export const TIER_COLORS = [
  'champagne-500', 'champagne-400', 'champagne-300',
  'rose-400', 'rose-500',
  'cream-300', 'cream-500',
  'silver-300', 'silver-500',
];

/**
 * Tailwind safelist — literal class strings keep JIT from tree-shaking these
 * away when they're only referenced via runtime template literals like
 * `bg-${tier.color}/10`. Don't refactor this constant; do not break across
 * lines. The string itself is the safelist; the export stops the bundler
 * from removing it.
 */
export const TIER_COLOR_SAFELIST =
  "bg-champagne-500/10 text-champagne-500 bg-champagne-400/10 text-champagne-400 bg-champagne-300/10 text-champagne-300 bg-rose-400/10 text-rose-400 bg-rose-500/10 text-rose-500 bg-cream-300/10 text-cream-300 bg-cream-500/10 text-cream-500 bg-silver-300/10 text-silver-300 bg-silver-500/10 text-silver-500";

/**
 * useSocietyContent — pulls the editable content blocks from
 * bocage_site_data.data.society, falls back to hardcoded defaults if the
 * row hasn't been seeded yet or fetch fails. Returns a `refetch` so the
 * AdminCRM can pull fresh state right after saving.
 */
export function useSocietyContent() {
  const [content, setContent] = useState({
    benefits: DEFAULT_BENEFITS,
    testimonials: DEFAULT_TESTIMONIALS,
    faqs: DEFAULT_FAQS,
    service_tiers: DEFAULT_SERVICE_TIERS,
  });
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bocage_site_data')
      .select('data')
      .limit(1)
      .maybeSingle();
    const society = data?.data?.society || {};
    setContent({
      benefits:      Array.isArray(society.benefits)      && society.benefits.length      ? society.benefits      : DEFAULT_BENEFITS,
      testimonials:  Array.isArray(society.testimonials)  && society.testimonials.length  ? society.testimonials  : DEFAULT_TESTIMONIALS,
      faqs:          Array.isArray(society.faqs)          && society.faqs.length          ? society.faqs          : DEFAULT_FAQS,
      service_tiers: Array.isArray(society.service_tiers) && society.service_tiers.length ? society.service_tiers : DEFAULT_SERVICE_TIERS,
    });
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { ...content, loading, refetch };
}

/**
 * saveSocietyContent — merges a partial content object into
 * bocage_site_data.data.society without clobbering other top-level keys
 * (the marketing site uses bocage_site_data for its own fields).
 *
 * @param {object} partial — { benefits?, testimonials?, faqs? }
 * @returns {Promise<{ error?: Error }>}
 */
export async function saveSocietyContent(partial) {
  // Read current row first so we can merge rather than overwrite.
  const { data: row, error: readErr } = await supabase
    .from('bocage_site_data')
    .select('id, data')
    .limit(1)
    .maybeSingle();
  if (readErr) return { error: readErr };

  const nextData = {
    ...(row?.data || {}),
    society: {
      ...((row?.data || {}).society || {}),
      ...partial,
    },
  };

  if (row?.id) {
    const { error } = await supabase
      .from('bocage_site_data')
      .update({ data: nextData, updated_at: new Date().toISOString() })
      .eq('id', row.id);
    return { error };
  } else {
    // No row yet — insert one. Permissive INSERT policy lets this through.
    const { error } = await supabase
      .from('bocage_site_data')
      .insert({ data: nextData });
    return { error };
  }
}
