// ─────────────────────────────────────────────────────────────────────────────
// api/square/create-payment-link.js — start a Square-hosted checkout for a
// house-account top-up. Verifies the Supabase JWT so the amount is credited
// to the caller, and attaches profile_id as order metadata so the webhook
// can match the payment to a member.
//
// Env: SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID, SQUARE_ENVIRONMENT
//      (sandbox|production — defaults to production),
//      SUPABASE_URL, SUPABASE_ANON_KEY
// ─────────────────────────────────────────────────────────────────────────────
import { randomUUID } from "node:crypto";

const MIN_CENTS = 500;       // $5
const MAX_CENTS = 500_000;   // $5,000

/** Picks the correct Square API host for the configured environment */
function squareBase() {
  return process.env.SQUARE_ENVIRONMENT === "sandbox"
    ? "https://connect.squareupsandbox.com"
    : "https://connect.squareup.com";
}

/** Reads bearer token off the Authorization header */
function getBearer(req) {
  const h = req.headers.authorization || req.headers.Authorization;
  if (!h || !h.startsWith("Bearer ")) return null;
  return h.slice(7);
}

/** Verifies a Supabase access token via /auth/v1/user */
async function verifyUser(token) {
  const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: process.env.SUPABASE_ANON_KEY,
    },
  });
  if (!r.ok) return null;
  return r.json();
}

/** Resolves a user to the canonical house-account owner. For couples
 *  memberships, the partner's top-up should credit the PRIMARY buyer's
 *  account where the shared credit lives. Returns the caller's own id
 *  when no couples membership is found. */
async function resolveHouseAccountOwner(token, userId) {
  const r = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/bocage_memberships` +
      `?select=user_id,partner_user_id,tier,joined_at` +
      `&or=(user_id.eq.${userId},partner_user_id.eq.${userId})`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: process.env.SUPABASE_ANON_KEY,
      },
    },
  );
  if (!r.ok) return userId;
  const rows = await r.json();
  // Prefer rows with tier info (real purchases) over trigger-created stubs.
  const ranked = (rows || []).slice().sort((a, b) => {
    const at = a.tier ? 1 : 0;
    const bt = b.tier ? 1 : 0;
    if (at !== bt) return bt - at;
    return new Date(b.joined_at || 0) - new Date(a.joined_at || 0);
  });
  const m = ranked[0];
  if (!m || !m.user_id) return userId;
  return m.user_id;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = getBearer(req);
  if (!token) return res.status(401).json({ error: "Missing auth token" });

  const user = await verifyUser(token);
  if (!user?.id) return res.status(401).json({ error: "Invalid session" });

  const amountCents = Number(req.body?.amount_cents);
  if (!Number.isInteger(amountCents) || amountCents < MIN_CENTS || amountCents > MAX_CENTS) {
    return res.status(400).json({ error: `Amount must be between $${MIN_CENTS / 100} and $${MAX_CENTS / 100}` });
  }

  // Couples partners must credit the primary's account, not their own
  // auto-created $0 stub. Resolved server-side so a malicious client can't
  // route funds to an arbitrary profile_id.
  const targetProfileId = await resolveHouseAccountOwner(token, user.id);

  const origin = req.headers.origin || `https://${req.headers.host}`;

  const payload = {
    idempotency_key: randomUUID(),
    order: {
      location_id: process.env.SQUARE_LOCATION_ID,
      line_items: [
        {
          name: "Bocage house account top-up",
          quantity: "1",
          base_price_money: { amount: amountCents, currency: "USD" },
        },
      ],
      metadata: {
        profile_id: targetProfileId,
        type: "house_account_topup",
      },
    },
    pre_populated_data: { buyer_email: user.email },
    checkout_options: {
      redirect_url: `${origin}/society/profile?topup=success`,
      ask_for_shipping_address: false,
      enable_coupon: false,
      enable_loyalty: false,
    },
  };

  const r = await fetch(`${squareBase()}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      "Square-Version": "2025-01-23",
      Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await r.json();
  if (!r.ok) {
    console.error("Square payment-link create failed:", body);
    return res.status(502).json({ error: body?.errors?.[0]?.detail || "Square error" });
  }

  return res.status(200).json({ url: body.payment_link?.url });
}
