# Toast House Account Integration — Scoping & Status

**Goal (owner request):** Connect a Society member's in-app house account to their
**real Toast house-account balance**, matched by the same email / phone / name
used on their Society account, so the balance shown in the app reflects what's
actually owed/credited at the bar.

**Status: CLOSED — Option C chosen (2026-06-01).** There is no Toast API to read
house-account balances (see below), so the owner decision is to keep the app's
Square-funded prepaid house account as the in-app balance and treat the Toast
bar tab as a separate, in-person concern. No Toast house-account code was added.
Re-open this doc only if Toast later confirms a real balance-read endpoint
(Option A) or the Orders-reconstruction tradeoffs (Option B) become worth it.

---

## What exists today

- Society house accounts live in Supabase: `bocage_house_accounts` (balance) +
  `bocage_house_transactions` (ledger). Top-ups go through Square
  (`/api/square/create-payment-link`). This is a **self-contained** prepaid
  balance — it does **not** know about Toast.
- Toast is integrated **read-only for menus only** (`bocage/api/toast/menus.js`),
  authenticating as `TOAST_MACHINE_CLIENT` against `ws-api.toasttab.com` using
  `TOAST_CLIENT_ID` / `TOAST_CLIENT_SECRET` / `TOAST_RESTAURANT_GUID`.

## Why it's blocked

Toast house accounts are real and are searchable **in the Toast POS UI** by
guest name, email, phone, or customer number. But that's a POS-UI feature, not
an API one.

**Confirmed via Toast's developer docs (May 2026):** across *every* documented
machine-client API module — Analytics (`era`), Cash Management (`cashmgmt`),
Configuration (`config`), Credit Cards (`ccpartner`), Gift Cards, Kitchen,
Labor (`labor`), Loyalty, Menus (`menus`), Orders (`orders`), Order Management
Config, Packaging, Partners (`partners`), Restaurant Availability, Restaurants
(`restaurants`), Stock, Tender — **none exposes**:

- a "read house-account balance" endpoint, or
- a "look up guest/customer by email, phone, or name" endpoint.

The "Pay a house account balance" and "Lookup Customer" flows are documented
**only** as POS-UI procedures (`platformPayHouseAccountBalance.html`), with no
REST contract. So this is **not** a missing-scope problem a partner upgrade
trivially fixes — there is no documented endpoint to call at all.

Sources:
- API overview / module list — https://doc.toasttab.com/doc/devguide/apiOverview.html
- Paying a house account balance (POS-UI only) — https://doc.toasttab.com/doc/platformguide/platformPayHouseAccountBalance.html
- API reference portal — https://toastintegrations.redoc.ly/

## Three ways forward (owner decision required)

**Option A — Ask Toast for a custom/partner data feed.** Email the Toast
integrations team (via the partner portal) and ask directly: "Is there any
API — including partner-tier or beta — to read a guest's outstanding
house-account balance and look them up by email/phone/name?" If yes, capture the
endpoint contract + scopes and the "Planned implementation" below gets built.
Cost: a back-and-forth with Toast; uncertain outcome. This is the only path to a
*real-time, authoritative* Toast balance in the app.

**Option B — Reconstruct the balance from the Orders API.** The `orders` module
*is* readable. We could pull a member's checks and sum the payments tendered to
their house account to approximate a running balance. Honest caveats: this is
**money-adjacent and imperfect** — it misses invoiced/manual POS adjustments and
credits applied outside the order flow, requires matching Toast guest identity to
the Society profile (no contact-lookup endpoint, so matching is heuristic), and
reading full order history is heavy. Would need explicit owner sign-off before
building, and must be labeled in-app as an estimate, not the authoritative
balance.

**Option C — Keep them separate (status quo, recommended near-term).** The app's
Square-funded prepaid house account (`bocage_house_accounts`) already works
end-to-end. Leave it as the in-app balance and treat the Toast bar tab as a
separate, in-person thing. Zero risk, zero Toast dependency. Revisit if Option A
turns up a real endpoint.

## Planned implementation (once unblocked)

A server endpoint (e.g. `api/society-toast-balance.js` in this repo, alongside
the Square functions) that:

1. Verifies the caller's Supabase JWT (same pattern as
   `api/square/create-payment-link.js`) and loads their `bocage_profiles`
   row (email, phone, full_name).
2. Authenticates to Toast as `TOAST_MACHINE_CLIENT` (reuse the menus auth flow).
3. Looks up the Toast guest/house-account by email → phone → name (in that
   priority), returning the outstanding balance.
4. Returns `{ matched: boolean, balanceCents, lastSyncedAt }`. On no match or no
   permission, returns `{ matched: false }` so the UI cleanly falls back to the
   existing Supabase house-account display.

UI: in `src/pages/Profile.jsx`, show the Toast balance (read-only, "balance at
the bar") next to / instead of the Supabase prepaid balance when `matched` is
true, with a clear label so the two are never confused.

**Guardrails:** read-only (never write to Toast); cache per request; never expose
Toast credentials client-side; gate behind a `TOAST_HOUSE_ACCOUNT_ENABLED` env
flag so it can be turned on only after the scope is confirmed and tested.

---

_Last updated as part of the May 2026 owner-feedback work. Re-open the task once
Toast house-account read access is confirmed._
