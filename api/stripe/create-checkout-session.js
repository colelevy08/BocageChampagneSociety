// ─────────────────────────────────────────────────────────────────────────────
// api/stripe/create-checkout-session.js — start a Stripe Checkout for a
// house-account top-up. Verifies the Supabase JWT so the amount is credited
// to the caller, not a spoofed profile_id.
//
// Env: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_ANON_KEY
// ─────────────────────────────────────────────────────────────────────────────
import Stripe from "stripe";

const MIN_CENTS = 500;       // $5
const MAX_CENTS = 500_000;   // $5,000

/** Reads bearer token off the Authorization header */
function getBearer(req) {
  const h = req.headers.authorization || req.headers.Authorization;
  if (!h || !h.startsWith("Bearer ")) return null;
  return h.slice(7);
}

/** Verifies a Supabase access token against the project's /auth/v1/user endpoint */
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

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // Determine origin for success/cancel redirects. Society is served under
  // /society/ basename, so we return the user to /society/profile.
  const origin = req.headers.origin || `https://${req.headers.host}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: "Bocage house account top-up",
            description: "Prepaid balance for drinks, bottles, and Society events at Bocage.",
          },
        },
      },
    ],
    metadata: {
      profile_id: user.id,
      type: "house_account_topup",
    },
    success_url: `${origin}/society/profile?topup=success`,
    cancel_url: `${origin}/society/profile?topup=cancel`,
  });

  return res.status(200).json({ url: session.url });
}
