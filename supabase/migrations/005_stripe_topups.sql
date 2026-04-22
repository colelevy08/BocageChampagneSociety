-- ============================================================================
-- Bocage Champagne Society — Stripe top-up idempotency
-- ============================================================================
-- Adds stripe_session_id to bocage_house_transactions so the Stripe webhook
-- can credit a house account exactly once even if Stripe retries delivery.
-- ============================================================================

ALTER TABLE public.bocage_house_transactions
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- Partial unique index: NULL session ids (non-Stripe admin credits/debits)
-- remain unconstrained; Stripe-originated rows can't double-post.
CREATE UNIQUE INDEX IF NOT EXISTS bocage_house_transactions_stripe_session_idx
  ON public.bocage_house_transactions(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
