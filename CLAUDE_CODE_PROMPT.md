# CLAUDE CODE PROMPT — Bocage Champagne Society App

Copy everything below this line and paste it as your first message in Claude Code when working on this project.

---

## Project Context

You are working on **Bocage Champagne Society**, a cross-platform mobile app for Bocage Champagne Bar (10 Phila St, Saratoga Springs, NY). The app is a luxury membership/loyalty platform that compiles to native iOS and Android apps via Capacitor, and also deploys as a web app on Vercel.

**Owners:** Clark Gale and Zac Denham (Sure Thing Hospitality)
**Contact:** Zac@SureThingHospitality.com

---

## Tech Stack (DO NOT change without asking)

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 19 |
| Build | Vite | 8 |
| CSS | Tailwind CSS | 4 (v4 syntax — uses `@import "tailwindcss"` and `@theme {}`, NOT tailwind.config.js) |
| Routing | React Router | 7 |
| Animation | Framer Motion | 12 |
| Icons | Lucide React | 0.577+ |
| Native Wrapper | Capacitor | 8 |
| Backend/Auth/DB | Supabase (PostgreSQL) | 2.99+ |
| Date Utils | date-fns | 4 |
| Web Hosting | Vercel | — |
| App Stores | iOS (App Store) + Android (Google Play) via Capacitor | — |

---

## Coding Conventions (ALWAYS follow these)

1. **Every file must have a JSDoc comment block at the top** explaining:
   - What the file does
   - What it connects to (which other files import/use it)
   - What files it imports from
   
2. **Every function must have a comment block** explaining what it does, its parameters, and return value.

3. **Inline comments on complex lines** — explain WHY, not just WHAT.

4. **When you create or modify ANY file**, update the top-of-file comment block to reflect current connections. If you add a new import, note it. If another file now depends on this one, note it.

5. **Always update the README.md** when adding new features, pages, dependencies, database tables, or changing the project structure. Keep the Project Structure tree, Tech Stack table, and Features section current.

6. **Use Tailwind utility classes** for all styling. Never write separate CSS files per component. Global styles go in `src/index.css` only.

7. **Use the custom theme tokens** defined in `src/index.css` — colors are `champagne-*`, `noir-*`, `rose-*`. Fonts are `font-display` (Playfair Display), `font-serif` (Cormorant Garamond), `font-sans` (Outfit).

8. **Supabase is the only backend.** All data lives in Supabase PostgreSQL. Auth uses Supabase Auth. File uploads use Supabase Storage. No Express servers, no Firebase, no other backends.

9. **Capacitor is the native bridge.** All native features (push notifications, haptics, splash screen, camera, etc.) go through `@capacitor/*` packages. Check `src/lib/capacitor.js` before adding new native features.

---

## Project Structure

```
bocage-champagne-society/
├── capacitor.config.ts             # Native iOS/Android config (appId: com.bocage.champagnesociety)
├── vite.config.js                  # Vite + Tailwind v4 plugin
├── index.html                      # Root HTML with mobile viewport meta, Google Fonts
├── package.json                    # Dependencies and Capacitor build scripts
├── .env.example                    # Template for Supabase credentials
├── .gitignore
├── README.md                       # Detailed project documentation
├── public/
│   └── manifest.json               # PWA manifest (name, colors, icons)
├── src/
│   ├── main.jsx                    # Entry — mounts React, calls initializeApp()
│   ├── App.jsx                     # Root — BrowserRouter > AuthProvider > Routes
│   ├── index.css                   # Tailwind v4 @theme{} with champagne/noir/rosé colors
│   ├── lib/
│   │   ├── supabase.js             # Supabase client (reads VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
│   │   └── capacitor.js            # Native init: splash screen, status bar, push notifications
│   ├── context/
│   │   └── AuthContext.jsx          # Global auth: user, profile, membership, isAdmin, signIn/Up/Out
│   ├── components/
│   │   └── layout/
│   │       ├── AppLayout.jsx        # Page wrapper: Outlet + TabBar + page transitions
│   │       └── TabBar.jsx           # Bottom tab nav: Menu, Society, Events, At Home, [Inventory], Profile
│   └── pages/
│       ├── Auth.jsx                 # Login/signup screen (shown when not authenticated)
│       ├── Menu.jsx                 # Wine/champagne catalog — reads from "wines" table
│       ├── Membership.jsx           # Flûte/Magnum/Jeroboam tiers, points, progress bar
│       ├── Events.jsx               # Event listings + RSVP booking — reads "events" + "event_bookings"
│       ├── AtHome.jsx               # At Home With Bocage booking — writes to "at_home_bookings"
│       ├── Profile.jsx              # User settings, sign out
│       └── AdminInventory.jsx       # Admin-only wine CRUD with photo upload to Supabase Storage
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql   # All 8 tables, RLS policies, triggers, seed data
```

---

## Database Schema (Supabase PostgreSQL)

All tables have Row Level Security (RLS) enabled.

### profiles
- `id` UUID PK → auth.users(id)
- `full_name` TEXT
- `phone` TEXT
- `avatar_url` TEXT
- `role` TEXT DEFAULT 'member' — set to 'admin' for inventory access
- `push_token` TEXT
- `created_at`, `updated_at` TIMESTAMPTZ

### membership_tiers (seeded with 3 rows)
- `id` UUID PK
- `name` TEXT — "Flûte", "Magnum", "Jeroboam"
- `slug` TEXT UNIQUE — "flute", "magnum", "jeroboam"
- `points_required` INT — 0, 500, 2000
- `points_multiplier` DECIMAL — 1.0, 1.5, 2.0
- `monthly_price` DECIMAL
- `description` TEXT
- `sort_order` INT

### memberships
- `id` UUID PK
- `user_id` UUID → auth.users (UNIQUE)
- `tier_id` UUID → membership_tiers
- `points` INT DEFAULT 0
- `joined_at`, `updated_at` TIMESTAMPTZ

### point_transactions
- `id` UUID PK
- `user_id` UUID → auth.users
- `points` INT (positive = earned, negative = spent)
- `description` TEXT
- `source` TEXT — "visit", "event", "purchase", "bonus", "redemption"
- `created_at` TIMESTAMPTZ

### wines
- `id` UUID PK
- `name` TEXT NOT NULL
- `producer`, `region` TEXT
- `vintage` INT
- `category` TEXT — "champagne", "sparkling", "still", "cocktail"
- `description` TEXT (tasting notes)
- `image_url` TEXT (Supabase Storage public URL)
- `price_glass`, `price_bottle` DECIMAL
- `is_available` BOOLEAN DEFAULT true
- `is_featured` BOOLEAN DEFAULT false
- `stock_count` INT
- `created_at`, `updated_at` TIMESTAMPTZ

### events
- `id` UUID PK
- `title` TEXT NOT NULL
- `description` TEXT
- `event_date` TIMESTAMPTZ
- `location` TEXT DEFAULT '10 Phila St, Saratoga Springs'
- `image_url` TEXT
- `max_seats`, `seats_remaining` INT
- `min_tier` TEXT DEFAULT 'flute' — tier gating
- `price` DECIMAL
- `is_active` BOOLEAN DEFAULT true
- `created_at` TIMESTAMPTZ

### event_bookings
- `id` UUID PK
- `user_id` UUID → auth.users
- `event_id` UUID → events
- `status` TEXT DEFAULT 'confirmed'
- `booked_at` TIMESTAMPTZ
- UNIQUE(user_id, event_id)

### at_home_bookings
- `id` UUID PK
- `user_id` UUID → auth.users
- `service_tier` TEXT — "sparkle-serve", "celebrate-home", "signature"
- `preferred_date` DATE
- `guest_count` INT
- `location` TEXT
- `notes` TEXT
- `status` TEXT DEFAULT 'pending'
- `created_at` TIMESTAMPTZ

### Supabase Storage
- Bucket: `wine-images` (public) — stores bottle photos uploaded from AdminInventory

### Trigger
- `handle_new_user()` — fires AFTER INSERT on auth.users, creates a profile row and a Flûte-tier membership automatically.

---

## Design System

### Color Tokens (defined in src/index.css @theme{})
- `champagne-50` through `champagne-700` — gold accent scale (brand color: champagne-500 = #D4A843)
- `noir-50` through `noir-900` — dark background scale (app bg: noir-900 = #0A0A0A)
- `rose-300` through `rose-500` — rosé pink accent for membership badges

### Typography
- `font-display` = Playfair Display (headings — luxury serif)
- `font-serif` = Cormorant Garamond (body — refined serif)
- `font-sans` = Outfit (UI labels, buttons — clean sans)

### Custom CSS Classes (in src/index.css)
- `.text-gradient-gold` — champagne gradient text effect
- `.glass` — glass morphism (blur + translucent dark bg + gold border)
- `.shimmer-gold` — animated gold shimmer for primary CTA buttons
- `.no-scrollbar` — hides scrollbar for horizontal carousels

### Design Principles
- Dark luxury theme throughout (noir-900 background)
- Champagne gold accents for CTAs and highlights
- Glass morphism for floating UI (tab bar, modals)
- Staggered entrance animations on lists (framer-motion)
- iOS safe area handling (env(safe-area-inset-*))
- Mobile-first — all layouts designed for phone screens

---

## Auth Flow

1. App loads → `main.jsx` renders `<App />` and calls `initializeApp()`
2. `App.jsx` wraps everything in `<AuthProvider>` which checks for existing session
3. While loading → branded splash screen with Bocage logo
4. No session → `<Auth />` page (login/signup)
5. Has session → `<AppLayout />` with tab navigation + page routes
6. On signup → Supabase trigger auto-creates profile + Flûte membership
7. On login (native) → registers push notification token in profile

---

## Capacitor Native Build Commands

```bash
npm run build                    # Build web assets to dist/
npx cap add ios                  # Add iOS platform (first time)
npx cap add android              # Add Android platform (first time)
npx cap sync                     # Sync dist/ to native projects
npx cap open ios                 # Open in Xcode
npx cap open android             # Open in Android Studio
npm run cap:build:ios             # Build + sync for iOS
npm run cap:build:android         # Build + sync for Android
```

App ID: `com.bocage.champagnesociety`
App Name: `Bocage Society`

---

## What's Been Built (Complete)

- [x] Full project scaffolding (Vite + React + Tailwind v4 + Capacitor)
- [x] Custom dark luxury theme with champagne/noir/rosé color system
- [x] Supabase client initialization
- [x] Capacitor native initialization (splash, status bar, push)
- [x] AuthContext provider (user, profile, membership, isAdmin, signIn/Up/Out)
- [x] Bottom tab bar navigation with glass morphism
- [x] AppLayout with animated page transitions
- [x] Auth page (login + signup with Bocage branding)
- [x] Menu page (wine/champagne catalog with search + category filters)
- [x] Membership page (Flûte/Magnum/Jeroboam tiers, points, progress, benefits)
- [x] Events page (listings + booking with tier-gating and seat tracking)
- [x] AtHome page (3-tier private experience booking form)
- [x] Profile page (settings, sign out, Bocage links)
- [x] AdminInventory page (full CRUD with photo uploads, availability toggles)
- [x] Complete database migration with 8 tables, RLS, triggers, seed data
- [x] PWA manifest
- [x] Detailed README
- [x] .env.example and .gitignore

---

## What Still Needs To Be Done

### Immediate (Setup & Deployment)
- [ ] Create Supabase project and run the migration SQL
- [ ] Create `wine-images` storage bucket in Supabase (set to public)
- [ ] Set up .env.local with real Supabase credentials
- [ ] Deploy web version to Vercel
- [ ] Initialize git repo and push to GitHub
- [ ] Set admin role on owner accounts
- [ ] Add iOS platform (`npx cap add ios`) and configure Xcode signing
- [ ] Add Android platform (`npx cap add android`) and configure signing
- [ ] Set up Apple Developer account + App Store Connect listing
- [ ] Set up Google Play Developer account + Play Console listing
- [ ] Configure APNs (iOS) and FCM (Android) for push notifications

### Feature Development (Next Phase)
- [ ] Admin events management page (create/edit/delete events)
- [ ] Admin At-Home booking management dashboard (view/confirm/complete requests)
- [ ] Admin points management (award points to members manually, e.g. after a visit)
- [ ] QR code check-in system — generate QR at bar, member scans for points
- [ ] Wine detail page (tap a wine card to see full details, larger photo, pairings)
- [ ] Event detail page (tap an event for full info, attendee list for admins)
- [ ] Notification center / inbox for push notification history
- [ ] Password reset / forgot password flow
- [ ] Email verification reminder screen
- [ ] Onboarding flow for new members (swipeable intro slides)
- [ ] Pull-to-refresh on Menu, Events, and Membership pages
- [ ] Image optimization / lazy loading improvements
- [ ] Haptic feedback on button taps (native only via @capacitor/haptics)

### Future Features (Roadmap)
- [ ] Apple Pay / Google Pay for event tickets
- [ ] Social sharing (share events, achievements)
- [ ] Wine cellar curation request flow
- [ ] Referral program with bonus points
- [ ] Resy integration for bar reservations
- [ ] Wine club subscription management
- [ ] Member-to-member messaging for event coordination
- [ ] Analytics dashboard for admins (popular wines, event attendance, points economy)

---

## Important Reminders

1. **This is a MOBILE APP first.** Every UI decision should prioritize phone-sized screens. Test at 375px width minimum. Always account for safe areas (notch, home indicator).

2. **Capacitor wraps the web app.** The same React code runs on web, iOS, and Android. Use `isNative` from `src/lib/capacitor.js` to conditionally enable native-only features.

3. **Supabase RLS is critical.** Every new table MUST have RLS enabled with appropriate policies. Users should never see other users' data (except public content like wines and events).

4. **The design must feel LUXURY.** This is a champagne bar, not a casual beer app. Dark backgrounds, gold accents, serif headings, smooth animations, glass morphism. Refer to the design system above.

5. **Comments are mandatory.** The codebase uses thorough JSDoc-style comments. Every new file and function needs them. Every modified file needs its comments updated.

6. **Keep the README current.** It's the project's documentation hub. Update it whenever you add features, change structure, or add dependencies.

---

## How To Start Working

```bash
cd bocage-champagne-society
cat README.md                    # Read the full project docs
cat src/index.css                # Understand the theme system
cat src/App.jsx                  # Understand the routing structure
cat src/context/AuthContext.jsx   # Understand the auth flow
cat supabase/migrations/001_initial_schema.sql  # Understand the database
npm run dev                      # Start the dev server
```

Then tell me what you'd like to build or fix, and I'll implement it following all the conventions above.
