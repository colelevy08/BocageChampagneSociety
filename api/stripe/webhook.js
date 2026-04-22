// ─────────────────────────────────────────────────────────────────────────────
// api/stripe/webhook.js — Stripe webhook handler. Verifies the signature,
// then credits the member's bocage_house_accounts balance and writes a
// transaction row tagged with stripe_session_id for idempotency.
//
// Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL,
//      SUPABASE_SERVICE_ROLE_KEY
// ─────────────────────────────────────────────────────────────────────────────
import Stripe from "stripe";

// Stripe requires the raw, unparsed body to verify the signature.
export const config = { api: { bodyParser: false } };

/** Collects the raw request body into a Buffer */
async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

/** Thin Supabase REST helper — uses the service role to bypass RLS. */
async function sb(path, init = {}) {
  return fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

/**
 * Credit the member's house account and write a ledger entry. The
 * stripe_session_id has a partial unique index, so a duplicate webhook
 * delivery errors on insert and we skip the balance update.
 */
async function applyTopup({ profile_id, amount_cents, session_id }) {
  // 1. Resolve or create the account row. Trigger normally seeds it at
  //    signup; select first to get the account id.
  let acctRes = await sb(`bocage_house_accounts?profile_id=eq.${profile_id}&select=id,balance`, { method: "GET" });
  let rows = await acctRes.json();
  let acct = rows[0];
  if (!acct) {
    const createRes = await sb("bocage_house_accounts", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ profile_id, balance: 0 }),
    });
    const created = await createRes.json();
    acct = Array.isArray(created) ? created[0] : created;
  }

  // 2. Insert ledger row first — unique index on stripe_session_id makes
  //    this the idempotency barrier. If it fails with a conflict we stop.
  const amountDollars = (amount_cents / 100).toFixed(2);
  const txnRes = await sb("bocage_house_transactions", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      account_id: acct.id,
      type: "credit",
      amount: amountDollars,
      description: "Online top-up via Stripe",
      stripe_session_id: session_id,
    }),
  });
  if (txnRes.status === 409 || txnRes.status === 400) {
    const text = await txnRes.text();
    if (text.includes("duplicate key") || text.includes("stripe_session")) {
      return { status: "duplicate" };
    }
    throw new Error(`Transaction insert failed: ${txnRes.status} ${text}`);
  }
  if (!txnRes.ok) {
    throw new Error(`Transaction insert failed: ${txnRes.status} ${await txnRes.text()}`);
  }

  // 3. Update balance. Doing it after the ledger insert means a retry can
  //    never double-credit even if this PATCH fails and Stripe re-delivers.
  const newBalance = Number(acct.balance) + Number(amountDollars);
  const balRes = await sb(`bocage_house_accounts?id=eq.${acct.id}`, {
    method: "PATCH",
    body: JSON.stringify({ balance: newBalance, updated_at: new Date().toISOString() }),
  });
  if (!balRes.ok) {
    throw new Error(`Balance update failed: ${balRes.status} ${await balRes.text()}`);
  }

  return { status: "credited", newBalance };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    const raw = await readRawBody(req);
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.metadata?.type === "house_account_topup" && session.payment_status === "paid") {
      try {
        const result = await applyTopup({
          profile_id: session.metadata.profile_id,
          amount_cents: session.amount_total,
          session_id: session.id,
        });
        console.log("Top-up result:", result);
      } catch (err) {
        console.error("Top-up failed:", err);
        return res.status(500).json({ error: err.message });
      }
    }
  }

  return res.status(200).json({ received: true });
}
