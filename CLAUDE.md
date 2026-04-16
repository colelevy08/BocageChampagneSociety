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

Tables (all `bocage_*` prefixed, all RLS-enabled):
`bocage_profiles`, `bocage_memberships`, `bocage_wines`, `bocage_events`,
`bocage_event_bookings`, `bocage_at_home_bookings`, `bocage_site_data`.

**Single membership product — no tiers, no points.**
The `bocage_memberships` row exists per-user only to track join date and status.
Auto-signup trigger (`bocage_handle_new_user`) creates a profile + membership row.
Storage bucket: `wine-images` (public).

Migration history in `supabase/migrations/` — note that 001 references the original
tier+points design which was removed in 003.

## Pages

| Route | File | Description |
|-------|------|-------------|
| (no auth) | Auth.jsx | Login/signup with Bocage branding |
| / | Menu.jsx | Wine/champagne catalog with search + filters |
| /membership | Membership.jsx | Single-product Society status, member-since, benefits |
| /events | Events.jsx | Event listings + booking (open to all members) |
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

**Colors**
- Brand gold: `champagne-500` (#D4A843) — bright highlight: `champagne-300` (#F8D97C)
- App background: `noir-900` (#0C0906) — warm espresso black
- Card surface: `noir-800` (#120E0A) — warm near-black
- Silver: `silver-300` (#CCCCD8) polished sterling, `silver-500` (#8E8EA8) mid
- Cream/Ivory: `cream-300` (#E8DFC0) warm ivory, `cream-500` (#C8B888) aged parchment
- Rosé accent: `rose-500` (#EC4899)

**Typography**
- Headings: Playfair Display (`font-display`)
- Body: Cormorant Garamond (`font-serif`)
- UI/Buttons: Outfit (`font-sans`)

**Gradient text utilities**
- `.text-gradient-gold` — five-stop antique-to-bullion sweep
- `.text-gradient-silver` — polished sterling chrome sweep
- `.text-gradient-cream` — warm ivory sweep
- `.text-gradient-luxe` — gold + silver duotone (most glamorous headings)
- `.text-gradient-rose` — rosé pink sweep

**Glass / surface utilities**
- `.glass` — standard warm-black glass with gold border
- `.glass-elevated` — deeper blur + inset highlight
- `.glass-gold` — champagne-tinted hero surfaces
- `.glass-silver` — cool silver-tinted secondary surfaces

**Shimmer / glow / animation utilities**
- `.shimmer-gold`, `.shimmer-silver` — moving light sweep
- `.glow-gold`, `.glow-silver`, `.glow-rose` — ambient halo
- `.border-gradient-gold`, `.border-gradient-silver` — metallic border seam
- `.divider-gold`, `.divider-silver` — thin gradient rule
- `.glint` — one-time sweep (new badges, premium indicators)
- `.bubble-flicker` — champagne bubble pulse
- `.no-scrollbar`, `.hover-lift`, `.stagger-in`
