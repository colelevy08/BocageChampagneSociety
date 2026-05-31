# Toast House Account Integration — Scoping & Status

**Goal (owner request):** Connect a Society member's in-app house account to their
**real Toast house-account balance**, matched by the same email / phone / name
used on their Society account, so the balance shown in the app reflects what's
actually owed/credited at the bar.

**Status: BLOCKED on Toast API access — not yet implemented.** This document
captures why and exactly what's needed to finish it. No guessed/undocumented
Toast calls have been added to the app (that would risk the live member
experience).

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
guest name, email, phone, or customer number. However:

- Toast's machine-client API surface (Menus / Orders / Labor / Config) does
  **not** expose a documented "read house-account balance" or "look up house
  account by guest contact" endpoint for general integrations.
- House-account read access appears to require **Toast partner-tier access** and
  specific scopes granted to the integration, if it's offered at all.

Until we confirm our Toast app is permitted to read house-account data, there's
no safe endpoint to call.

## What to do to unblock (action items)

1. **Confirm Toast scope.** Log in to the Toast partner/integration portal (or
   contact the Toast integrations team) and verify whether the existing Bocage
   Toast app (the one behind `TOAST_CLIENT_ID`) can be granted **house account
   read** access, and which API module/endpoint exposes:
   - guest/customer lookup by email, phone, or name, and
   - the house-account outstanding balance for that guest.
2. **Get the endpoint contract.** Capture the exact request/response shape +
   required scopes for those endpoints.
3. Hand that back here and the implementation below can be built and tested on a
   Vercel preview.

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
