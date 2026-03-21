-- ============================================================================
-- Bocage Champagne Society — Initial Database Schema
-- ============================================================================
-- Creates all 8 tables with RLS policies, the auto-signup trigger,
-- and seed data for membership tiers.
-- Run this in your Supabase SQL Editor after creating the project.
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES
-- Extends auth.users with app-specific fields (name, phone, role, push token)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member',
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow the trigger to insert profiles for new users
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. MEMBERSHIP TIERS
-- Three tiers: Flûte (free), Magnum (500 pts), Jeroboam (2000 pts)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE membership_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  points_required INT DEFAULT 0,
  points_multiplier DECIMAL(3,1) DEFAULT 1.0,
  monthly_price DECIMAL(10,2),
  description TEXT,
  sort_order INT DEFAULT 0
);

ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;

-- Everyone can read tiers (public info)
CREATE POLICY "Anyone can read tiers"
  ON membership_tiers FOR SELECT
  USING (true);

-- Seed the three tiers
INSERT INTO membership_tiers (name, slug, points_required, points_multiplier, monthly_price, description, sort_order) VALUES
  ('Flûte', 'flute', 0, 1.0, 0, 'Welcome tier — earn points on every visit and enjoy member-only events.', 1),
  ('Magnum', 'magnum', 500, 1.5, 25.00, 'Elevated access — 1.5x points, complimentary monthly glass, and priority seating.', 2),
  ('Jeroboam', 'jeroboam', 2000, 2.0, 75.00, 'The inner circle — 2x points, complimentary bottle, private lounge, and personal sommelier.', 3);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. MEMBERSHIPS
-- Links each user to a tier with their points balance
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tier_id UUID REFERENCES membership_tiers(id),
  points INT DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own membership"
  ON memberships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own membership"
  ON memberships FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert memberships"
  ON memberships FOR INSERT
  WITH CHECK (true);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. POINT TRANSACTIONS
-- Ledger of earned and spent points
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points INT NOT NULL,
  description TEXT,
  source TEXT DEFAULT 'visit',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON point_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert transactions"
  ON point_transactions FOR INSERT
  WITH CHECK (true);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. WINES
-- Wine/champagne catalog managed by admin
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE wines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  producer TEXT,
  region TEXT,
  vintage INT,
  category TEXT DEFAULT 'champagne',
  description TEXT,
  image_url TEXT,
  price_glass DECIMAL(10,2),
  price_bottle DECIMAL(10,2),
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  stock_count INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE wines ENABLE ROW LEVEL SECURITY;

-- Everyone can read available wines
CREATE POLICY "Anyone can read wines"
  ON wines FOR SELECT
  USING (true);

-- Only admins can insert/update/delete wines (enforced at app level + service role)
CREATE POLICY "Admins can manage wines"
  ON wines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- 6. EVENTS
-- Upcoming events with tier-gating and seat tracking
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ,
  location TEXT DEFAULT '10 Phila St, Saratoga Springs',
  image_url TEXT,
  max_seats INT,
  seats_remaining INT,
  min_tier TEXT DEFAULT 'flute',
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Everyone can read active events
CREATE POLICY "Anyone can read events"
  ON events FOR SELECT
  USING (true);

-- Admins can manage events
CREATE POLICY "Admins can manage events"
  ON events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- 7. EVENT BOOKINGS
-- RSVP records linking users to events
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE event_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'confirmed',
  booked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, event_id)
);

ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON event_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings"
  ON event_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 8. AT-HOME BOOKINGS
-- Private champagne experience booking requests
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE at_home_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_tier TEXT NOT NULL,
  preferred_date DATE,
  guest_count INT,
  location TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE at_home_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own at-home bookings"
  ON at_home_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own at-home bookings"
  ON at_home_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- TRIGGER: Auto-create profile + Flûte membership on signup
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  flute_tier_id UUID;
BEGIN
  -- Get the Flûte tier ID
  SELECT id INTO flute_tier_id FROM membership_tiers WHERE slug = 'flute';

  -- Create profile
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');

  -- Create membership at Flûte tier
  INSERT INTO memberships (user_id, tier_id, points)
  VALUES (NEW.id, flute_tier_id, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fire the trigger after a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
