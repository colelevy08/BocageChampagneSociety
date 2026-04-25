# Bocage Champagne Society

Members-only platform for **Bocage Champagne Bar** (10 Phila St, Saratoga Springs, NY). Web app + Capacitor wrapper for native iOS / Android. Lives at `bocagechampagnebar.com/society` (proxied through the marketing site) and `bocage-champagne-society.vercel.app/society` direct.

**Owners:** Clark Gale & Zac Denham (Sure Thing Hospitality)

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 6 |
| CSS | Tailwind CSS 4 (`@theme{}` syntax) |
| Routing | React Router 7 (basename `/society`) |
| Animation | Framer Motion 12 |
| Icons | Lucide React |
| Native | Capacitor 6 (iOS + Android) — app id `com.bocage.champagnesociety` |
| Backend | Supabase — auth, Postgres, Storage |
| Hosting | Vercel (web), App Store + Google Play (native) |

---

## Pages

### Member-facing (signed in)
| Route | Page | Description |
|------|------|-------------|
| `/` | `Menu.jsx` | Wine catalog with search, category + service-type filters, grid/list toggle, debounced query |
| `/events` | `Events.jsx` | Upcoming events with countdown, RSVP via `bocage_event_bookings` |
| `/at-home` | `AtHome.jsx` | Three-tier in-home service booking; tiers, testimonials, and FAQs are admin-editable |
| `/profile` | `Profile.jsx` | Editable name + phone, **house account balance + Add funds (Square Checkout)**, transaction drawer, gift card section (Toast hosted), Quick Links, Bocage contact, Privacy/Terms/Main-site links, Sign out |
| `/privacy` | `Privacy.jsx` | Privacy policy (mirror of marketing site) |
| `/terms` | `Terms.jsx` | Terms of service (mirror of marketing site) |

### Admin-only
| Route | Page | Description |
|------|------|-------------|
| `/admin/inventory` | `AdminInventory.jsx` | Full wine CRUD with image upload, search, category filters, availability toggle, stats |
| `/admin/crm` | `AdminCRM.jsx` | **Members + Events + At-Home + Content** — full editing surface (see below) |

### Pre-auth
| Route | Page | Description |
|------|------|-------------|
| (no path) | `Auth.jsx` | Login / signup / forgot password with rotating taglines and password strength meter |

---

## AdminCRM — fully editable

Admin status = `bocage_profiles.role = 'admin'`. Granted/revoked from inside CRM itself.

**Members tab**
- Inline edit name, phone, joined date
- Toggle admin role (with self-revoke confirm)
- Internal admin notes (separate table — members can never read their own)
- Credit / debit house account + transaction ledger
- Remove from Society (cascades through bookings + house ledger)
- CSV export of the filtered list

**Events tab**
- *Manage:* create / edit / delete / publish-hide events with full form
- *RSVPs:* inline status dropdown + delete

**At-Home tab**
- Edit booking details + status; Confirm / Cancel / Mark-completed; Delete

**Content tab** *(text shown to members, no code change required)*
- Benefits — Membership + Profile "What's Included"
- Testimonials — At-Home page quotes
- FAQs — At-Home page accordion
- At-Home tiers — name, tagline, description, price, max guests, icon, color, features
- Branding — login taglines + bottom-tab labels

All Content edits are merged into `bocage_site_data.data.society` so the marketing site's keys in the same row are not disturbed.

---

## Database

Single shared Supabase project (`jstdkdjcnburwwseqjnp`) — also used by the marketing site.

### Tables (all `bocage_*` prefixed, all RLS-enabled)

| Table | Purpose |
|------|---------|
| `bocage_profiles` | Members. Name, phone, role, push token. 1:1 with `auth.users` |
| `bocage_memberships` | Per-user join date and status |
| `bocage_house_accounts` | One row per member with USD balance, optional Toast/Square ids |
| `bocage_house_transactions` | Append-only credit/debit ledger; partial unique index on `square_order_id` for idempotent webhook delivery |
| `bocage_member_notes` | Admin-only notes table (separate to prevent member self-read) |
| `bocage_events` | Event listings managed via AdminCRM |
| `bocage_event_bookings` | Member RSVPs |
| `bocage_at_home_bookings` | Private experience requests |
| `bocage_wines` | Catalog driving the Menu page (synced from Toast) |
| `bocage_site_data` | Shared JSON config — marketing site keys + `data.society.*` for editable Society copy |

### Migrations (`supabase/migrations/`)

| # | What |
|--|------|
| 001 | Initial schema (legacy tier/point system, dropped in 003) |
| 002 | Seed by-the-glass menu |
| 003 | Drop tiers + points; single-product membership |
| 004 | `bocage_house_accounts` + `bocage_house_transactions` + `handle_new_user` extension |
| 005 | `square_order_id` column + partial unique index for top-up idempotency |
| 006 | `bocage_is_admin()` SECURITY DEFINER fn + fixed `bocage_profiles_admin_all` policy (was blocking cross-member admin edits) |
| 007 | `bocage_member_notes` table with admin-only RLS |

### Trigger

`bocage_handle_new_user()` fires on `INSERT ON auth.users` and seeds:
1. `bocage_profiles` row
2. `bocage_memberships` row
3. `bocage_house_accounts` row with `balance = 0`

---

## Auth flow

1. Member signs up with email + password + full name on `Auth.jsx`
2. Supabase confirmation email arrives → redirect URL = `${origin}/society` so verification lands them at the Society login screen with a "Email verified" toast
3. Trigger seeds the three tables above
4. Sign in → `AuthProvider` exposes `{ user, profile, membership, isAdmin, signOut }` to all pages

Helper text on the signup form encourages re-using the email tied to any existing Bocage Toast house account so we can match later.

---

## Payments

Bocage's payment stack:
- **Toast** — in-bar POS, gift cards (hosted egift redirect from Society Profile and from marketing `GiftCardsPage`), all menu transactions
- **Square** — every other online payment (merch, private-event deposits, ticket sales, **and house-account top-ups via this app**)

The Society house-account top-up flow is built but **not yet live**:
- `api/square/create-payment-link.js` — verifies the Supabase JWT, creates a Square Online Checkout payment link with `order.metadata.profile_id`
- `api/square/webhook.js` — verifies the HMAC-SHA256 signature over `(notificationUrl + raw body)`, credits the member's `bocage_house_accounts` row on `payment.updated` with status `COMPLETED`, idempotent on `square_order_id`
- Profile UI exposes an "Add funds" amount picker → Square Checkout → `?topup=success` return handler

To enable, set in Vercel env:
- `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_ENVIRONMENT` (sandbox|production)
- `SQUARE_WEBHOOK_URL` (production-canonical URL of `/api/square/webhook`), `SQUARE_WEBHOOK_SIGNATURE_KEY`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

Then create a Square webhook subscription pointed at `/api/square/webhook` for `payment.updated`.

The Toast Orders API path (so members could fund through Toast settlement) is gated behind partner approval — the existing creds are read-only, verified `403` on `POST /orders/v2/orders`. Documentation for the partner request lives at `docs/TOAST_INTEGRATION_ARCHITECTURE.md`.

---

## Coding conventions

1. Every file gets a JSDoc header explaining what it does and what it's connected to.
2. Tailwind utility classes only — no per-component CSS files.
3. Custom theme tokens — colors `champagne-*`, `noir-*`, `rose-*`, `cream-*`, `silver-*`. Fonts `font-display` (Playfair), `font-serif` (Cormorant), `font-sans` (Outfit).
4. Mobile-first design — everything tested at 375px width and respects safe-area insets.
5. Supabase is the only backend — no separate API server. Serverless functions in `api/` for things that need a secret (Square access token, Supabase service role).
6. Every new table needs RLS policies. Use the `bocage_is_admin()` helper for admin-only access.

---

## Build commands

```bash
npm run dev                  # Vite dev server at localhost:5173
npm run build                # Production build → dist/
npm run preview              # Serve the build locally
npm run cap:build:ios        # Build + sync for iOS
npm run cap:build:android    # Build + sync for Android
npx cap open ios             # Open Xcode
npx cap open android         # Open Android Studio
```

Production web auto-deploys on push to `main` via Vercel (project: `bocage-champagne-society`).

---

## Environment variables (.env.local)

```
VITE_SUPABASE_URL=https://jstdkdjcnburwwseqjnp.supabase.co
VITE_SUPABASE_ANON_KEY=<from Supabase → Settings → API>
```

Server-side (Vercel project env, not in `.env.local`):
- Square + Supabase service-role secrets listed in the Payments section above.
- `TOAST_CLIENT_ID`, `TOAST_CLIENT_SECRET`, `TOAST_RESTAURANT_GUID` for the Toast menu sync (read-only).

---

## Repo layout

```
api/                    Vercel serverless functions
  square/               Square Checkout + webhook (Society-side)
docs/
  TOAST_INTEGRATION_ARCHITECTURE.md   For Toast partner application
  OWNER_BRIEF.gs        Apps Script that builds a Google Form for owners
  OWNER_BRIEF.html      Standalone offline version of the same brief
src/
  App.jsx               BrowserRouter (basename /society) + AuthProvider + AppLayout
  context/AuthContext.jsx
  lib/
    supabase.js         Single Supabase client
    societyContent.js   Shared editable-content hook + defaults + icon map
  components/
    layout/             AppLayout, TabBar, ErrorBoundary
    ui/                 PageHeader, Badge, Button, Modal, ConfirmDialog, Toast, …
  pages/                Auth, Menu, Events, AtHome, Membership, Profile,
                        AdminInventory, AdminCRM, Privacy, Terms
  hooks/                useDebounce, useHaptics, useOnlineStatus, usePullToRefresh
supabase/migrations/    SQL files 001 … 007
```
