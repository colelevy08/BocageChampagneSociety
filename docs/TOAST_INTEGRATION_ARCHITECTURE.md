# Bocage Champagne Society — Toast integration architecture

**Prepared for:** Toast Integrations team, in support of partner integration approval request.
**Prepared by:** Bocage Champagne Bar LLC, Saratoga Springs, NY.
**Date:** April 22, 2026.
**Integration type:** Internal-use, single-restaurant (Bocage Champagne Bar, location ID `ad5f7549-4bd2-432b-8aa5-13323eda8d1f`). Not a marketplace partner; not resold.

## 1. Summary

Bocage operates a members-only platform called the Bocage Champagne Society. The platform runs at [bocage.vercel.app/society](https://bocage.vercel.app/society) with a separate standalone surface at [bocage-champagne-society.vercel.app](https://bocage-champagne-society.vercel.app). Members sign up with an email address, join the Society, RSVP to events, and track a prepaid house-account balance used at the bar.

We are requesting two Toast integration capabilities:

1. **Orders API write scopes** so that a Society member can fund the prepaid house-account balance online via credit card, with the payment settling into Bocage's normal Toast transaction stream.
2. **(Optional follow-on) Gift Card Outbound Integration** so that gift cards can be purchased and balance-checked directly in the Society app and on the marketing site, replacing the current Toast-hosted redirect.

The remainder of this document covers scope 1 in detail. Scope 2 can be filed separately if preferred.

## 2. Business context

Bocage Champagne Bar is a single-location champagne bar at 10 Phila Street, Saratoga Springs, New York. It has been a Toast customer since 2021. Toast is the point-of-sale for all on-premise transactions, including gift cards and the existing Toast house-account feature. The Society platform exists to deepen the member relationship — it does not replace Toast, it mirrors the member-facing slice of the data that helps members track their own balance and upcoming events.

The feature we are adding — online funding of the Society house-account balance — exists today only as an in-person action ("top up at the bar"). Adding an online path reduces bar staff friction and matches how other Society features (event RSVPs, member birthday lookups) already work.

## 3. Data model

The Society platform stores the following in a Supabase Postgres database:

| Table | Purpose |
|---|---|
| `bocage_profiles` | Member name, phone, optional birthday. Linked 1:1 to Supabase Auth users by UUID. |
| `bocage_memberships` | Society membership status and join date. |
| `bocage_events`, `bocage_event_bookings`, `bocage_at_home_bookings` | Event listings and RSVPs. |
| `bocage_house_accounts` | One row per member with current balance in USD (mirrored ledger; Toast remains the authoritative POS). |
| `bocage_house_transactions` | Append-only ledger of credits and debits against the house account, with `stripe_session_id` (legacy) and `square_order_id` (legacy) columns retained nullable. |

All tables have row-level security enabled. Members can only read their own rows. Admin users (Bocage staff designated in the `bocage_profiles.role = 'admin'` field) can read and write all rows.

**Credit card data is never stored or touched.** The member's payment-card details will be captured via Toast's tokenization widget in the member's browser and sent directly to Toast. Our server never holds a raw PAN.

## 4. Online house-account top-up flow (proposed)

```
┌─────────────┐           ┌─────────────────────┐          ┌──────────────┐
│   Member    │           │  Society serverless │          │     Toast    │
│  (browser)  │           │     (Vercel)        │          │     API      │
└──────┬──────┘           └──────────┬──────────┘          └──────┬───────┘
       │                             │                             │
       │ 1. POST /api/toast/topup    │                             │
       │    { amount_cents }         │                             │
       │    Authorization: Supabase  │                             │
       │──────────────────────────── >│                             │
       │                             │ 2. Verify JWT, resolve      │
       │                             │    profile_id               │
       │                             │                             │
       │                             │ 3. POST /orders/v2/orders   │
       │                             │    with a single            │
       │                             │    "House Account Top-Up"   │
       │                             │    line item                │
       │                             │────────────────────────── > │
       │                             │                             │
       │                             │  4. Returns order GUID      │
       │                             │ <───────────────────────────│
       │                             │                             │
       │ 5. Returns card-capture URL │                             │
       │    + order GUID             │                             │
       │< ────────────────────────────│                             │
       │                             │                             │
       │ 6. Loads Toast tokenization │                             │
       │    widget; member enters    │                             │
       │    card details             │                             │
       │ ──────────────────────────────────────────────────────── >│
       │                             │                             │
       │ 7. Toast returns card token │                             │
       │ <──────────────────────────────────────────────────────── │
       │                             │                             │
       │ 8. POST /api/toast/pay      │                             │
       │    { order_guid,            │                             │
       │      card_token }           │                             │
       │──────────────────────────── >│                             │
       │                             │ 9. Toast authorize CC +     │
       │                             │    add payment to order     │
       │                             │────────────────────────── > │
       │                             │                             │
       │                             │ 10. Order paid              │
       │                             │ <───────────────────────────│
       │                             │                             │
       │ 11. Redirect to /profile    │                             │
       │     ?topup=success           │                             │
       │ <────────────────────────────│                             │
       │                             │                             │
       │                             │ 12. Webhook:                │
       │                             │     orders.modified         │
       │                             │ <───────────────────────────│
       │                             │                             │
       │                             │ 13. Credit member's         │
       │                             │     bocage_house_accounts   │
       │                             │     + write ledger entry    │
       │                             │     keyed on order GUID     │
       │                             │     (idempotent)            │
       │                             │                             │
```

All server-to-server traffic runs over HTTPS. Toast order GUID is the idempotency key for the ledger credit — a duplicate webhook delivery hits a partial unique index and is discarded.

## 5. Scopes requested

| Scope | Why we need it |
|---|---|
| `orders.orders:write` | Create the top-up order. |
| `orders.items:write` | Attach the "House Account Top-Up" line item. |
| `orders.payments:write` | Apply the authorized credit-card payment. |
| `orders.discounts:write` | (Optional) apply member pricing to the top-up line item. |
| `credit_cards.authorization:write` | Authorize the card token returned by Toast's widget. |
| Existing read scopes | Continue current menu-sync functionality for the marketing site. |

We are **not** requesting `cashmgmt:write`, labor scopes, stock scopes, or any scope not needed for this specific flow.

## 6. Security posture

- **Credentials.** Toast `clientId` / `clientSecret` stored in Vercel environment variables with production-scope access restricted to the Society project. Rotated on demand. Not committed to the repository.
- **Card data.** Never persisted, logged, or traversed by our servers. Tokenization handled by Toast's widget on the client; our backend sees only the opaque card token.
- **Authentication.** Member requests authenticated by Supabase JWT; server verifies the token against Supabase's `/auth/v1/user` endpoint before creating an order so a malicious caller cannot credit another member's balance.
- **Webhooks.** Signature verification on every inbound webhook using Toast's signing key; unsigned or mismatched payloads rejected with HTTP 400 without touching the ledger.
- **Database.** Supabase Postgres, encrypted at rest. Row-level security on every table. Service role key used only in server-side webhook handlers.
- **Transport.** HTTPS only, HSTS enabled at the Vercel edge.
- **Retention.** Transaction records retained seven years for tax/accounting. Member PII deletable on request within thirty days.

## 7. Reliability and monitoring

- Vercel serverless functions run in multi-region edge with 99.99% platform SLA.
- Webhook handler is idempotent by construction; Toast retries are safe.
- Errors logged to Vercel; alerts routed to the designated technical contact below.
- Expected traffic at launch: under 50 top-ups per day, typical amount $50–$200.

## 8. Designated contacts

- **Business signatory:** Clark Gale, co-owner and Restaurant Success contact at Bocage.
- **Technical contact:** Cole Levy, developer of the Society platform. Email `colelevy0102@gmail.com`. Available for integration questions during Toast's review and throughout the sandbox → production certification.
- **Privacy contact:** `hello@bocagechampagnebar.com`.

## 9. Supporting URLs

- Public site: [bocagechampagnebar.com](https://bocagechampagnebar.com) (alias: `bocage.vercel.app`)
- Society app: [bocage-champagne-society.vercel.app](https://bocage-champagne-society.vercel.app) (path `/society`)
- Privacy policy: [bocagechampagnebar.com/privacy](https://bocagechampagnebar.com/privacy)
- Terms of service: [bocagechampagnebar.com/terms](https://bocagechampagnebar.com/terms)

## 10. Requested next step

Please assign a Toast Integrations reviewer and issue sandbox credentials scoped to Bocage's location GUID so we can build and test the flow end-to-end. We are prepared to sign the Toast Developer Agreement on request and to schedule a walkthrough of the implementation before production switchover.
