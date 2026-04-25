-- ============================================================================
-- Bocage Champagne Society — fix admin edit access across Society tables
-- ============================================================================
-- The original bocage_profiles_admin_all policy required ((auth.uid() = id)
-- AND (role = 'admin')), which only let an admin edit their OWN profile.
-- This blocked the AdminCRM from updating member name/phone/role.
--
-- Other Society tables (events, bookings, memberships, house accounts)
-- already have a correct admin_all policy that does an EXISTS lookup
-- against bocage_profiles. We can't apply the same pattern directly to
-- bocage_profiles itself without recursion, so we lift the role check into
-- a SECURITY DEFINER function that bypasses RLS for the lookup.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.bocage_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM bocage_profiles WHERE id = auth.uid()),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.bocage_is_admin() TO anon, authenticated;

DROP POLICY IF EXISTS bocage_profiles_admin_all ON public.bocage_profiles;

CREATE POLICY bocage_profiles_admin_all ON public.bocage_profiles
  FOR ALL
  USING (public.bocage_is_admin())
  WITH CHECK (public.bocage_is_admin());
