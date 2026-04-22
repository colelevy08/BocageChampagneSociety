-- ============================================================================
-- Bocage Champagne Society — Square top-up idempotency
-- ============================================================================
-- Adds square_order_id to bocage_house_transactions so the Square webhook
-- can credit a house account exactly once even if Square retries delivery
-- (payment.created followed by payment.updated for the same order, etc).
-- ============================================================================

ALTER TABLE public.bocage_house_transactions
  ADD COLUMN IF NOT EXISTS square_order_id TEXT;

-- Partial unique index: NULL order ids (non-Square admin credits/debits)
-- remain unconstrained; Square-originated rows can't double-post.
CREATE UNIQUE INDEX IF NOT EXISTS bocage_house_transactions_square_order_idx
  ON public.bocage_house_transactions(square_order_id)
  WHERE square_order_id IS NOT NULL;
