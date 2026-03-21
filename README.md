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

- **Auth** — Email/password login and signup with Bocage branding
- **Wine Catalog** — Searchable, filterable menu with category tabs and pricing
- **Membership** — Three-tier system (Flûte / Magnum / Jeroboam) with points, progress bar, and benefits
- **Events** — Upcoming event listings with tier-gating, seat tracking, and RSVP booking
- **At Home** — Private champagne experience booking with three service tiers
- **Profile** — User info, tier badge, sign out
- **Admin Inventory** — Full wine CRUD with photo uploads, availability toggles, stock tracking

---

## Project Structure

```
bocage-champagne-society/
├── capacitor.config.ts             # Native iOS/Android config
├── vite.config.js                  # Vite + Tailwind v4 plugin
├── index.html                      # Root HTML with Google Fonts
├── package.json                    # Dependencies and scripts
├── .env.example                    # Supabase credential template
├── .gitignore
├── CLAUDE.md                       # Claude Code project context
├── CLAUDE_CODE_PROMPT.md           # Full development prompt
├── README.md                       # This file
├── public/
│   └── manifest.json               # PWA manifest
├── src/
│   ├── main.jsx                    # Entry — mounts React, calls initializeApp()
│   ├── App.jsx                     # Root — BrowserRouter > AuthProvider > Routes
│   ├── index.css                   # Tailwind v4 @theme{} with champagne/noir/rosé tokens
│   ├── lib/
│   │   ├── supabase.js             # Supabase client
│   │   └── capacitor.js            # Native init (splash, status bar, push)
│   ├── context/
│   │   └── AuthContext.jsx          # Global auth state + actions
│   ├── components/
│   │   └── layout/
│   │       ├── AppLayout.jsx        # Page wrapper + TabBar + transitions
│   │       └── TabBar.jsx           # Bottom tab nav with glass morphism
│   └── pages/
│       ├── Auth.jsx                 # Login/signup
│       ├── Menu.jsx                 # Wine catalog
│       ├── Membership.jsx           # Tier info + points + progress
│       ├── Events.jsx               # Event listings + booking
│       ├── AtHome.jsx               # At-Home experience booking
│       ├── Profile.jsx              # User settings
│       └── AdminInventory.jsx       # Admin wine CRUD
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql   # 8 tables, RLS, triggers, seed data
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
4. Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

### 3. Run locally

```bash
npm run dev     # Dev server at localhost:5173
```

### 4. Build for production

```bash
npm run build   # Outputs to dist/
```

### 5. Native builds (Capacitor)

```bash
npx cap add ios              # First time only
npx cap add android          # First time only
npm run cap:build:ios        # Build + sync iOS
npm run cap:build:android    # Build + sync Android
npx cap open ios             # Open Xcode
npx cap open android         # Open Android Studio
```

---

## Database

8 tables with Row Level Security: `profiles`, `membership_tiers`, `memberships`, `point_transactions`, `wines`, `events`, `event_bookings`, `at_home_bookings`.

Auto-signup trigger creates a profile and Flûte membership for every new user.

Storage bucket: `wine-images` (public).

See `supabase/migrations/001_initial_schema.sql` for the full schema.

---

## Design System

- **Colors:** `champagne-*` (gold), `noir-*` (dark), `rose-*` (pink accent)
- **Fonts:** Playfair Display (headings), Cormorant Garamond (body), Outfit (UI)
- **Effects:** `.glass` (glass morphism), `.shimmer-gold` (button shimmer), `.text-gradient-gold`
- **Aesthetic:** Dark luxury theme, mobile-first, safe area aware

---

## App Identity

- **App ID:** `com.bocage.champagnesociety`
- **App Name:** Bocage Society
- **Location:** 10 Phila St, Saratoga Springs, NY
