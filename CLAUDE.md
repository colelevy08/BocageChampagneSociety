# CLAUDE.md — Bocage Champagne Society

This file is auto-read by Claude Code on every session. It provides project context, conventions, and architecture.

## Project Overview

Cross-platform mobile app for **Bocage Champagne Bar** (Saratoga Springs, NY). Membership/loyalty platform with wine catalog, event bookings, At-Home experiences, and admin inventory management. Deploys to iOS App Store, Google Play Store, and Vercel (web).

## Tech Stack

- **Frontend:** React 19 + Vite 8 + Tailwind CSS 4 (v4 syntax with `@theme{}`)
- **Routing:** React Router 7
- **Animation:** Framer Motion 12
- **Icons:** Lucide React
- **Native:** Capacitor 8 (iOS + Android) — app ID: `com.bocage.champagnesociety`
- **Backend:** Supabase (Auth + PostgreSQL + Storage) — no other backend
- **Hosting:** Vercel (web), App Store (iOS), Google Play (Android)

## Coding Conventions — ALWAYS FOLLOW

1. **Every file** must have a JSDoc comment block at the top explaining: what it does, what it connects to, what imports from it.
2. **Every function** must have a comment explaining purpose, params, return value.
3. **Inline comments** on complex logic — explain WHY not just WHAT.
4. **When modifying any file**, update its top comment block to reflect current connections.
5. **Always update README.md** when adding features, pages, dependencies, or tables.
6. **Tailwind utility classes only** — no separate CSS files per component. Global styles in `src/index.css`.
7. **Use custom theme tokens**: colors `champagne-*`, `noir-*`, `rose-*`. Fonts: `font-display`, `font-serif`, `font-sans`.
8. **Supabase is the only backend.** All new tables need RLS policies.
9. **Mobile-first design.** Test at 375px width. Always handle safe areas.
10. **Luxury aesthetic.** Dark backgrounds, gold accents, serif headings, glass morphism, smooth animations.

## Key Architecture

- `src/main.jsx` → mounts React + calls `initializeApp()` from capacitor.js
- `src/App.jsx` → `BrowserRouter > AuthProvider > AppRoutes` — shows Auth page if no session, AppLayout if authenticated
- `src/context/AuthContext.jsx` → global state: user, profile, membership, isAdmin, signIn/Up/Out
- `src/components/layout/AppLayout.jsx` → Outlet + TabBar + page transitions
- `src/components/layout/TabBar.jsx` → bottom tab nav (admin inventory tab conditional on isAdmin)
- `src/lib/supabase.js` → Supabase client (reads VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
- `src/lib/capacitor.js` → native init: splash, status bar, push notifications, platform detection
- `src/index.css` → Tailwind v4 `@theme{}` with champagne/noir/rosé tokens + utility classes

## Database (Supabase PostgreSQL)

8 tables with RLS: `profiles`, `membership_tiers` (Flûte/Magnum/Jeroboam), `memberships`, `point_transactions`, `wines`, `events`, `event_bookings`, `at_home_bookings`. Auto-signup trigger creates profile + Flûte membership. Storage bucket: `wine-images` (public).

Full schema in `supabase/migrations/001_initial_schema.sql`.

## Pages

| Route | File | Description |
|-------|------|-------------|
| (no auth) | Auth.jsx | Login/signup with Bocage branding |
| / | Menu.jsx | Wine/champagne catalog with search + filters |
| /membership | Membership.jsx | Tiers, points balance, progress, benefits |
| /events | Events.jsx | Event listings + booking with tier-gating |
| /at-home | AtHome.jsx | 3-tier At-Home private experience booking |
| /profile | Profile.jsx | User settings, sign out |
| /admin/inventory | AdminInventory.jsx | Admin wine CRUD with photo uploads |

## Build Commands

```bash
npm run dev                  # Dev server at localhost:5173
npm run build                # Production build to dist/
npm run cap:build:ios        # Build + sync for iOS
npm run cap:build:android    # Build + sync for Android
npx cap open ios             # Open Xcode
npx cap open android         # Open Android Studio
```

## Design Tokens

- Brand gold: `champagne-500` (#D4A843)
- App background: `noir-900` (#0A0A0A)
- Card surface: `noir-800` (#111111)
- Rosé accent: `rose-500` (#EC4899)
- Headings: Playfair Display (`font-display`)
- Body: Cormorant Garamond (`font-serif`)
- UI/Buttons: Outfit (`font-sans`)
- Effects: `.glass`, `.shimmer-gold`, `.text-gradient-gold`, `.no-scrollbar`
