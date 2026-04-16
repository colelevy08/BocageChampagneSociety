-- ============================================================================
-- Bocage Champagne Society — Drop tiers and points system
-- ============================================================================
-- Society moves to a single membership product. Removes:
--   • bocage_point_transactions (empty ledger table)
--   • bocage_membership_tiers   (3 tier definitions)
--   • bocage_memberships.tier_id, .points columns
--   • bocage_events.min_tier column (no more tier-gated events)
-- And rewrites bocage_handle_new_user() to no longer set tier/points.
-- ============================================================================

-- 1. Rewrite the auto-signup trigger first so it stops referencing the tiers
--    table before we drop it.
CREATE OR REPLACE FUNCTION public.bocage_handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO bocage_profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO bocage_memberships (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 2. Drop the points ledger.
DROP TABLE IF EXISTS public.bocage_point_transactions CASCADE;

-- 3. Drop the tier columns from memberships (the FK to tiers goes with it).
ALTER TABLE public.bocage_memberships DROP COLUMN IF EXISTS tier_id;
ALTER TABLE public.bocage_memberships DROP COLUMN IF EXISTS points;

-- 4. Drop the tier definitions table.
DROP TABLE IF EXISTS public.bocage_membership_tiers CASCADE;

-- 5. Drop tier-gating from events (open to all members now).
ALTER TABLE public.bocage_events DROP COLUMN IF EXISTS min_tier;
