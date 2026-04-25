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
} from 'lucide-react';
import { supabase } from './supabase';

/** Icon strings that admins can pick from when editing a benefit. Render code
    looks each one up in this map; unknown names fall back to Sparkles. */
export const ICON_MAP = {
  Wine, CalendarHeart, Sparkles, Gift, Users, Crown, Shield, Star,
  Award, Heart, Flame, MapPin, Calendar, Mail, Phone, Wallet, Trophy,
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
      benefits:     Array.isArray(society.benefits)     && society.benefits.length     ? society.benefits     : DEFAULT_BENEFITS,
      testimonials: Array.isArray(society.testimonials) && society.testimonials.length ? society.testimonials : DEFAULT_TESTIMONIALS,
      faqs:         Array.isArray(society.faqs)         && society.faqs.length         ? society.faqs         : DEFAULT_FAQS,
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
