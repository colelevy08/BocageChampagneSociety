// ─────────────────────────────────────────────────────────────────────────────
// api/square/webhook.js — Square webhook handler. Verifies the HMAC-SHA256
// signature over (notificationUrl + rawBody) with the subscription's
// signature key, then credits the member's bocage_house_accounts balance
// when a payment for a house_account_topup order completes.
//
// Env: SQUARE_ACCESS_TOKEN, SQUARE_WEBHOOK_SIGNATURE_KEY, SQUARE_ENVIRONMENT,
//      SQUARE_WEBHOOK_URL (full public URL this endpoint is reachable at,
//      must match the subscription's notification URL exactly),
//      SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ─────────────────────────────────────────────────────────────────────────────
import { createHmac, timingSafeEqual } from "node:crypto";

// Square requires the raw body to verify the signature.
export const config = { api: { bodyParser: false } };

function squareBase() {
  return process.env.SQUARE_ENVIRONMENT === "sandbox"
    ? "https://connect.squareupsandbox.com"
    : "https://connect.squareup.com";
}

/** Collects the raw request body into a Buffer */
async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

/** Constant-time signature check per Square's HMAC-SHA256 scheme */
function verifySquareSignature(notificationUrl, rawBody, signatureHeader, signatureKey) {
  if (!signatureHeader || !signatureKey) return false;
  const expected = createHmac("sha256", signatureKey)
    .update(notificationUrl + rawBody.toString("utf8"))
    .digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
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

/** Fetch a Square order so we can read its metadata (profile_id) */
async function fetchSquareOrder(orderId) {
  const r = await fetch(`${squareBase()}/v2/orders/${orderId}`, {
    headers: {
      "Square-Version": "2025-01-23",
      Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
    },
  });
  if (!r.ok) throw new Error(`Square order fetch failed: ${r.status} ${await r.text()}`);
  const body = await r.json();
  return body.order;
}

/**
 * Credit the member's house account and write a ledger entry. The
 * square_order_id has a partial unique index, so a duplicate webhook
 * delivery errors on insert and we skip the balance update.
 */
async function applyTopup({ profile_id, amount_cents, order_id }) {
  let acctRes = await sb(`bocage_house_accounts?profile_id=eq.${profile_id}&select=id,balance`);
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

  const amountDollars = (amount_cents / 100).toFixed(2);
  const txnRes = await sb("bocage_house_transactions", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      account_id: acct.id,
      type: "credit",
      amount: amountDollars,
      description: "Online top-up via Square",
      square_order_id: order_id,
    }),
  });
  if (!txnRes.ok) {
    const text = await txnRes.text();
    if (text.includes("duplicate key") || text.includes("square_order_id")) {
      return { status: "duplicate" };
    }
    throw new Error(`Transaction insert failed: ${txnRes.status} ${text}`);
  }

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

  const raw = await readRawBody(req);
  const sigHeader = req.headers["x-square-hmacsha256-signature"];

  const ok = verifySquareSignature(
    process.env.SQUARE_WEBHOOK_URL,
    raw,
    sigHeader,
    process.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
  );
  if (!ok) {
    console.error("Square webhook signature verification failed");
    return res.status(400).send("Invalid signature");
  }

  let event;
  try {
    event = JSON.parse(raw.toString("utf8"));
  } catch {
    return res.status(400).send("Invalid JSON");
  }

  // Only credit on completed payments. Square sends payment.created and
  // payment.updated; we key off status === 'COMPLETED' and only act once
  // per order thanks to the unique index on square_order_id.
  if (event.type === "payment.created" || event.type === "payment.updated") {
    const payment = event.data?.object?.payment;
    if (payment?.status === "COMPLETED" && payment.order_id) {
      try {
        const order = await fetchSquareOrder(payment.order_id);
        if (order?.metadata?.type === "house_account_topup") {
          const result = await applyTopup({
            profile_id: order.metadata.profile_id,
            amount_cents: payment.amount_money?.amount ?? 0,
            order_id: payment.order_id,
          });
          console.log("Top-up result:", result);
        }
      } catch (err) {
        console.error("Top-up failed:", err);
        return res.status(500).json({ error: err.message });
      }
    }
  }

  return res.status(200).json({ received: true });
}
