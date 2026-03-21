# Bocage Champagne Society

Luxury membership and loyalty platform for **Bocage Champagne Bar** (10 Phila St, Saratoga Springs, NY). Cross-platform mobile app built with React + Capacitor, deployed to iOS, Android, and web.

**Owners:** Clark Gale & Zac Denham (Sure Thing Hospitality)

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 19 |
| Build | Vite | 6+ |
| CSS | Tailwind CSS | 4 (v4 `@theme{}` syntax) |
| Routing | React Router | 7 |
| Animation | Framer Motion | 12 |
| Icons | Lucide React | 0.577+ |
| Native | Capacitor | 6+ |
| Backend | Supabase (Auth + PostgreSQL + Storage) | 2.99+ |
| Dates | date-fns | 4 |
| Web Hosting | Vercel | — |
| App Stores | iOS (App Store) + Android (Google Play) | — |

---

## Features

### Core Pages
- **Auth** — Login/signup with animated branding, password strength meter, terms acceptance, forgot password flow
- **Wine Catalog (La Carte)** — Searchable, filterable menu with grid/list view toggle, sort options, debounced search, wine detail modal with full tasting notes
- **Membership (Society)** — Three-tier system (Flûte/Magnum/Jeroboam) with animated points counter, progress bar with glow effects, tier benefits comparison, point transaction history
- **Events** — Upcoming event listings with countdown timers, tier-gating, seat urgency bars, RSVP booking with toast feedback, share functionality
- **At Home** — Private champagne experience booking with three service tiers, expandable feature lists, guest testimonials carousel, FAQ accordion
- **Profile** — Editable user info (name, phone), membership stats, admin badge, sign out with styled confirmation dialog
- **Admin Inventory** — Stats dashboard, wine CRUD with search/filters (category + availability), photo uploads, styled modal forms, confirmation dialogs

### UX Improvements
- **Toast notification system** — Success, error, info, warning variants with auto-dismiss and animations
- **Skeleton loading** — Content-shaped shimmering placeholders instead of spinners
- **Pull-to-refresh** — Native-feeling gesture on all data pages
- **Haptic feedback** — Capacitor Haptics integration on native for taps, success, and error
- **Offline detection** — Banner overlay when connectivity is lost
- **Error boundary** — Graceful crash recovery with styled retry screen
- **Wine detail modal** — Tap any wine for full info, large image, pricing breakdown
- **Animated tab bar** — Spring-animated active indicator, haptic feedback on tab switch
- **Scroll restoration** — Auto-scroll to top on navigation
- **Confirmation dialogs** — Styled modals instead of browser alerts for destructive actions
- **Debounced search** — Prevents excessive filtering on rapid typing

### Design System Enhancements
- **Glass morphism** — Standard and elevated glass variants with blur effects
- **Glow effects** — Subtle gold and rosé glow on featured elements
- **Hover lift** — Cards lift with shadow on hover/tap
- **Skeleton shimmer** — Animated gradient placeholders
- **Gradient text** — Gold and rosé gradient text utilities
- **Custom focus rings** — Gold focus-visible outlines for accessibility
- **Selection styling** — Gold-tinted text selection

### Shared UI Components
- `Button` — Primary, secondary, ghost, danger, gold variants with loading state and icons
- `Modal` — Slide-up overlay with backdrop blur, escape key, body scroll lock
- `Toast` — Context-based notifications with 4 variants
- `Badge` — Color-coded labels (gold, rose, green, red, gray, blue)
- `Input` — Themed form fields with labels, icons, and error states
- `EmptyState` — Consistent empty list placeholders with optional actions
- `PageHeader` — Reusable gradient gold headers with subtitles and actions
- `Skeleton` — Content-shaped loading placeholders (wine card, event, profile, stat, inventory)
- `ConfirmDialog` — Styled destructive action confirmations
- `PasswordStrength` — Visual password strength indicator with color-coded bars

### Custom Hooks
- `usePullToRefresh` — Touch gesture detection for pull-to-refresh
- `useHaptics` — Capacitor haptic feedback (light, medium, heavy, success, error, selection)
- `useDebounce` — Value debouncing for search inputs
- `useOnlineStatus` — Network connectivity tracking

---

## Project Structure

```
bocage-champagne-society/
├── capacitor.config.ts
├── vite.config.js
├── index.html
├── package.json
├── .env.example
├── .gitignore
├── CLAUDE.md
├── CLAUDE_CODE_PROMPT.md
├── README.md
├── public/
│   └── manifest.json
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── lib/
│   │   ├── supabase.js
│   │   └── capacitor.js
│   ├── hooks/
│   │   ├── usePullToRefresh.js
│   │   ├── useHaptics.js
│   │   ├── useDebounce.js
│   │   └── useOnlineStatus.js
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── components/
│   │   ├── ErrorBoundary.jsx
│   │   ├── WineDetailModal.jsx
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx
│   │   │   └── TabBar.jsx
│   │   └── ui/
│   │       ├── Badge.jsx
│   │       ├── Button.jsx
│   │       ├── ConfirmDialog.jsx
│   │       ├── EmptyState.jsx
│   │       ├── Input.jsx
│   │       ├── Modal.jsx
│   │       ├── PageHeader.jsx
│   │       ├── PasswordStrength.jsx
│   │       ├── Skeleton.jsx
│   │       └── Toast.jsx
│   └── pages/
│       ├── Auth.jsx
│       ├── Menu.jsx
│       ├── Membership.jsx
│       ├── Events.jsx
│       ├── AtHome.jsx
│       ├── Profile.jsx
│       └── AdminInventory.jsx
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql
```

---

## Getting Started

### 1. Clone and install
```bash
git clone <repo-url>
cd bocage-champagne-society
npm install
```

### 2. Set up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL Editor
3. Create a `wine-images` storage bucket (set to public)
4. Copy `.env.example` to `.env.local` with your credentials

### 3. Run locally
```bash
npm run dev     # Dev server at localhost:5173
```

### 4. Native builds
```bash
npx cap add ios && npx cap add android   # First time
npm run cap:build:ios                    # Build + sync iOS
npm run cap:build:android                # Build + sync Android
```

---

## Database

8 tables with RLS: `profiles`, `membership_tiers`, `memberships`, `point_transactions`, `wines`, `events`, `event_bookings`, `at_home_bookings`.

Auto-signup trigger creates profile + Flûte membership. Storage bucket: `wine-images` (public).

---

## Design System

- **Colors:** `champagne-*` (gold), `noir-*` (dark), `rose-*` (pink)
- **Fonts:** Playfair Display / Cormorant Garamond / Outfit
- **Effects:** `.glass`, `.glass-elevated`, `.shimmer-gold`, `.text-gradient-gold`, `.glow-gold`, `.hover-lift`, `.skeleton`
- **Aesthetic:** Dark luxury, mobile-first, safe area aware, glass morphism
