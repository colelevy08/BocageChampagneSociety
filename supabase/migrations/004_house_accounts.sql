-- ============================================================================
-- Bocage Champagne Society — House accounts
-- ============================================================================
-- Adds a per-member house account balance + ledger, plus extends the
-- bocage_handle_new_user() trigger to seed a balance-0 row at signup.
-- Rows start unlinked (toast_account_id NULL) until an admin reconciles
-- with the Toast POS by matching the member's signup email.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. bocage_house_accounts — one row per member, created at signup
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bocage_house_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES public.bocage_profiles(id) ON DELETE CASCADE,
  balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  toast_account_id TEXT,
  linked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bocage_house_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view own house account"
  ON public.bocage_house_accounts FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Admins manage all house accounts"
  ON public.bocage_house_accounts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.bocage_profiles
      WHERE bocage_profiles.id = auth.uid()
      AND bocage_profiles.role = 'admin'
    )
  );

CREATE POLICY "Service role can insert house accounts"
  ON public.bocage_house_accounts FOR INSERT
  WITH CHECK (true);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. bocage_house_transactions — append-only credit/debit ledger
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bocage_house_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES public.bocage_house_accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit','debit','refund')),
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bocage_house_transactions_account_idx
  ON public.bocage_house_transactions(account_id, created_at DESC);

ALTER TABLE public.bocage_house_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view own house transactions"
  ON public.bocage_house_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bocage_house_accounts
      WHERE bocage_house_accounts.id = bocage_house_transactions.account_id
      AND bocage_house_accounts.profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all house transactions"
  ON public.bocage_house_transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.bocage_profiles
      WHERE bocage_profiles.id = auth.uid()
      AND bocage_profiles.role = 'admin'
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Extend bocage_handle_new_user() to seed a balance-0 house account row.
--    Unlinked until an admin reconciles toast_account_id by email.
-- ────────────────────────────────────────────────────────────────────────────
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

  INSERT INTO bocage_house_accounts (profile_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (profile_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. Backfill: create a $0 house account for every existing member.
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO public.bocage_house_accounts (profile_id, balance)
SELECT id, 0 FROM public.bocage_profiles
ON CONFLICT (profile_id) DO NOTHING;
