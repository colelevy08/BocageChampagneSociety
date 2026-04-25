-- ============================================================================
-- Bocage Champagne Society — admin notes on member profiles
-- ============================================================================
-- A separate table (rather than a column on bocage_profiles) because
-- bocage_profiles_select_own would otherwise let members read their own
-- "internal-only" notes. Only admins can read/write this table.
-- ============================================================================

-- If a previous attempt added the column, drop it. No data loss expected
-- since this migration was the only path that ever wrote to it.
ALTER TABLE public.bocage_profiles DROP COLUMN IF EXISTS admin_notes;

CREATE TABLE IF NOT EXISTS public.bocage_member_notes (
  profile_id UUID PRIMARY KEY REFERENCES public.bocage_profiles(id) ON DELETE CASCADE,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.bocage_member_notes ENABLE ROW LEVEL SECURITY;

-- Admin-only — no select/insert/update/delete for members.
CREATE POLICY bocage_member_notes_admin_all ON public.bocage_member_notes
  FOR ALL
  USING (public.bocage_is_admin())
  WITH CHECK (public.bocage_is_admin());
