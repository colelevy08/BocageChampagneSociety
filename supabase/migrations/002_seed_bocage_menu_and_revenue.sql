-- ============================================================================
-- Bocage Champagne Society — Seed Real Menu Data + Revenue Tables
-- ============================================================================
-- Seeds the wines table with actual Bocage Champagne Bar menu items,
-- adds revenue-generating tables for subscriptions, gift cards, referrals,
-- and in-app tab/ordering.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- SEED: Real Bocage Menu Items
-- ────────────────────────────────────────────────────────────────────────────

-- Bar Snacks
INSERT INTO wines (name, category, description, price_glass, is_available, is_featured) VALUES
  ('Smoked Almonds', 'food', NULL, 8, true, false),
  ('Marinated Olives', 'food', 'Provençal Spices, Saratoga Olive Oil, Citrus Zest', 12, true, false),
  ('Trail Mix', 'food', 'Dill Pickle-Ranch Recipe', 8, true, false);

-- Caviar
INSERT INTO wines (name, category, description, price_glass, is_available, is_featured) VALUES
  ('Just a Bump, Babe', 'food', 'Exclusively Sustainable & Humanely Harvested. Please Don''t Do Caviar in our Bathroom.', 16, true, true),
  ('Caviar Blinis', 'food', 'Four Blinis, Crème Fraîche, Chive', 40, true, true),
  ('Bocage Signature Caviar Service (30g)', 'food', 'Accompanied by Blini, Kettle Chips, Crème Fraîche, Chive', 140, true, true);

-- Something More
INSERT INTO wines (name, category, description, price_glass, is_available, is_featured) VALUES
  ('Fish ''n Chips', 'food', 'Daily Selection of Tinned Fish, Caper, Crème Fraîche, Lemon', 18, true, false),
  ('Flatbread', 'food', 'Caramelized Onion, Fontina & Gouda, Thyme, Arugula', 19, true, false),
  ('Bistro Crisps', 'food', 'Garlic Infused Kettle Crisps, Fresh Parmesan, Soft Herbs, Black Pepper', 15, true, false),
  ('Baked Brie', 'food', 'Fig Preserve, Toasted Pecans, Rosemary', 17, true, false),
  ('Fromage et Charcuterie', 'food', 'Our Daily Selection of Three Meats, Three Cheeses & Accompaniments', 45, true, true);

-- Something Sweet
INSERT INTO wines (name, category, description, price_glass, is_available, is_featured) VALUES
  ('Warm Chocolate Chip Cookies', 'food', 'Rosemary, Maldon Sea Salt', 14, true, false),
  ('Homemade Truffles', 'food', 'Inquire About Today''s Indulgence', 9, true, false);

-- Cocktails ($18)
INSERT INTO wines (name, category, description, price_glass, is_available, is_featured) VALUES
  ('Blanc Cheque', 'cocktail', 'Bimini Gin, Lillet Blanc, Lofi Sweet Vermouth, Black Lemon Bitters', 18, true, false),
  ('Cherry Cola Old Fashioned', 'cocktail', 'Misunderstood Spiced Whiskey, Mexican Coke, Cherry, Angostura', 18, true, true),
  ('The Content Creator', 'cocktail', 'Truman Vodka, Chinola Passion Fruit, Fresh Lime, Sparkling Wine', 18, true, false),
  ('Hurricane Alice', 'cocktail', 'A tribute to Zac''s late mother, Alice. Wildcat Sweet Rum, Passion Fruit, Fresh Orange & Lime, Cherry, Sparkling Wine', 18, true, true),
  ('She Got That Bubble', 'cocktail', 'Bayou Spiced Rum, Fresh Lime, Orgeat, All-Spice Dram, Bocage Everyday Cuvée', 18, true, false),
  ('Mez-Merized', 'cocktail', 'Mezcal Descartes Botanical, Fresh Lime, Giffard Triple-Sec, Agave Nectar', 18, true, false),
  ('Sour About Last Night', 'cocktail', 'Dudognon Cognac Reserve-10 Yr, Fresh Lemon, Orgeat, Sage-Honey Syrup', 18, true, false),
  ('Seasonal Spritz', 'cocktail', 'Something sparkling is always in season — Discover today''s spritz surprise!', 18, true, true);

-- First Class Flights
INSERT INTO wines (name, category, description, price_glass, is_available, is_featured) VALUES
  ('Global Grand Tour', 'sparkling', 'Explore the world of sparkling wine with a flight of four pours, each highlighting the unique character and winemaking traditions of its region. From bright and zesty to rich and refined, this curated journey celebrates the diversity of sparkling wines across the globe.', 55, true, true),
  ('Tour de Champagne', 'champagne', 'Embark on a journey through Champagne with four distinctly different expressions, each chosen to reveal a new side of this celebrated region. From crisp and elegant to rich and layered, this curated flight offers a tasting experience that highlights the incredible range Champagne has to offer.', 90, true, true);

-- Beer
INSERT INTO wines (name, category, description, price_glass, is_available, is_featured) VALUES
  ('Miller High Life', 'cocktail', 'The Champagne of Beers', 7, true, false),
  ('Phila Street Low Life Hazy IPA', 'cocktail', 'Whitman Brewing Company, served only at Bocage & Standard Fare', 9, true, false);

-- ────────────────────────────────────────────────────────────────────────────
-- REVENUE TABLE: Gift Cards
-- Purchasable digital gift cards with balance tracking
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE gift_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  purchaser_id UUID REFERENCES auth.users(id),
  recipient_email TEXT,
  recipient_name TEXT,
  original_amount DECIMAL(10,2) NOT NULL,
  remaining_balance DECIMAL(10,2) NOT NULL,
  message TEXT,
  is_active BOOLEAN DEFAULT true,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  redeemed_at TIMESTAMPTZ
);

ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gift cards"
  ON gift_cards FOR SELECT
  USING (auth.uid() = purchaser_id);

CREATE POLICY "Service role can manage gift cards"
  ON gift_cards FOR ALL
  WITH CHECK (true);

-- ────────────────────────────────────────────────────────────────────────────
-- REVENUE TABLE: Referrals
-- Track member referrals for bonus points + rewards
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_email TEXT NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id),
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, completed, rewarded
  bonus_points INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

-- ────────────────────────────────────────────────────────────────────────────
-- REVENUE TABLE: In-App Orders / Tab
-- Pre-order or open a tab from the app before arriving
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, confirmed, ready, completed, cancelled
  order_type TEXT DEFAULT 'bar', -- bar, preorder, delivery
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  tip DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- REVENUE TABLE: Order Items
-- Individual items within an order
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  wine_id UUID REFERENCES wines(id),
  item_name TEXT NOT NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

-- ────────────────────────────────────────────────────────────────────────────
-- REVENUE TABLE: Promotion Campaigns
-- Admin-created promotions for push notifications and in-app banners
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  promo_code TEXT UNIQUE,
  discount_type TEXT DEFAULT 'percentage', -- percentage, fixed, points_bonus
  discount_value DECIMAL(10,2),
  min_tier TEXT DEFAULT 'flute',
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  max_uses INT,
  current_uses INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active promotions"
  ON promotions FOR SELECT
  USING (true);

-- ────────────────────────────────────────────────────────────────────────────
-- Update membership tiers with real Bocage pricing
-- ────────────────────────────────────────────────────────────────────────────
UPDATE membership_tiers SET
  monthly_price = 0,
  description = 'Complimentary membership — earn points on every visit, access member-only events, and enjoy your birthday with a champagne toast.'
WHERE slug = 'flute';

UPDATE membership_tiers SET
  monthly_price = 29.99,
  description = 'Elevated access for the true champagne enthusiast. 1.5x points, complimentary monthly glass, priority event seating, and exclusive Magnum-only tastings.'
WHERE slug = 'magnum';

UPDATE membership_tiers SET
  monthly_price = 79.99,
  description = 'The inner circle. 2x points on every visit, complimentary bottle monthly, private lounge access, personal sommelier service, and VIP event access.'
WHERE slug = 'jeroboam';

-- ────────────────────────────────────────────────────────────────────────────
-- Seed: Sample events
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO events (title, description, event_date, location, max_seats, seats_remaining, min_tier, price, is_active) VALUES
  ('Champagne & Caviar Night', 'An evening of premium champagne pairings with our signature caviar service. Guided by our sommelier, discover the perfect marriage of bubbles and roe.', now() + interval '14 days', '10 Phila St, Saratoga Springs', 24, 24, 'flute', 85, true),
  ('Tour de Champagne Masterclass', 'Deep-dive into the regions of Champagne with our head sommelier. Four exclusive pours paired with artisanal French provisions.', now() + interval '21 days', '10 Phila St, Saratoga Springs', 16, 16, 'magnum', 120, true),
  ('Magnum Night: Double the Bubbles', 'Everything is better in a Magnum. Join us for an evening celebrating large-format champagne bottles with exclusive pours.', now() + interval '30 days', '10 Phila St, Saratoga Springs', 20, 20, 'magnum', 95, true),
  ('Jeroboam Society Dinner', 'An intimate five-course dinner for our top-tier members. Rare vintage champagnes, private chef, and an unforgettable evening.', now() + interval '45 days', '10 Phila St, Saratoga Springs', 12, 12, 'jeroboam', 250, true),
  ('Sunday Sparkling Brunch', 'Bottomless sparkling wine with a curated brunch menu. The perfect way to spend a Saratoga Sunday.', now() + interval '5 days', '10 Phila St, Saratoga Springs', 30, 30, 'flute', 55, true);
