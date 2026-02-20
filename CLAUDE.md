# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Deploy Commands

```bash
npm run dev          # Vite dev server
npm run build        # TypeScript check + Vite build (output → docs/)
npm run lint         # ESLint
firebase deploy      # Deploy hosting + Firestore rules
```

## Architecture

**BodyBalance** is a Dutch-language PWA (Weight Watchers-style) that converts calories to a daily points budget. iOS-native design with SF Pro fonts, rounded cards, bottom nav, safe areas.

### Tech Stack
- React 19 + TypeScript + Vite 7 + Tailwind CSS 4
- Zustand (state) + Dexie.js (IndexedDB v2) + Firebase SDK 11 (Auth, Firestore, Hosting)
- BrowserRouter with Firebase Hosting SPA rewrite (`** → /index.html`)

### Offline-First Sync
- **IndexedDB is primary** — all reads/writes go to Dexie first
- **Firestore is secondary** — fire-and-forget push after each local write
- **Login flow**: disabled check → email opslaan → `loadProfile()` (instant from IndexedDB) → `pullAll()` on background → `pushAll()` if no remote data
- **Account isolation**: `bb_current_uid` in localStorage; on UID mismatch, IndexedDB is cleared before sync
- API keys (`anthropicApiKey`, `anthropicApiUrl`) are NEVER pushed to Firestore

### Points System
- **Food points**: `(cal × 0.03) + (sat.fat × 0.28) + (sugar × 0.12) - (protein × 0.10) - (fiber × 0.10) - (unsat.fat × 0.05)`, min 0
- **Daily budget**: BMR (Mifflin-St Jeor) × activity → TDEE − 500 (lose) → kcal / 30 (min 23 pt)
- **Weekly points**: dailyPoints × 1.4
- Budget auto-recalculates on weight log; auto-switches to 'maintain' when goal weight is reached

### Drink → Water Intake
- When a drink is added as a meal entry, its volume is auto-added to water intake
- `src/lib/drink-water-mapping.ts` — keyword-based detection using `\b` word-boundary regex (same pattern as `isZeroPointFood()`)
- **100%**: thee, koffie (zwart/met melk), espresso, zero-sugar frisdrank, bouillon
- **50%**: cappuccino, latte, melk, sap, frisdrank, smoothie, sportdrank
- **0%**: alcohol (bier, wijn, sterke drank), energiedranken
- Detection is on **name only** — local foods (`dutch-foods.ts`) have no `unit` field, so don't gate on `unit === 'ml'`
- Toast with undo via `water-toast-store.ts` → `WaterToast.tsx`; Dashboard listens for `water-changed` CustomEvent

### Cross-Component Communication
- **`water-changed` CustomEvent**: dispatched after drink→water auto-add or undo; Dashboard listens to refresh water display
- **`themechange` CustomEvent**: dispatched from Profile theme toggle; App.tsx listens to apply dark mode

### Key Files
- `src/App.tsx` — Router, auth gate, sync orchestration, notification scheduler, theme watcher
- `src/store/user-store.ts` — Profile + weight management with budget recalculation
- `src/store/meal-store.ts` — Daily meal entries state
- `src/db/database.ts` — Dexie schema (v2), all DB helpers (meals, water, streaks, week summary)
- `src/lib/firestore-sync.ts` — Push/pull sync, `resetUserData()` admin function
- `src/lib/budget-calculator.ts` — BMR, TDEE, points budget calculation
- `src/lib/points-calculator.ts` — Food points formula
- `src/lib/food-api.ts` — Open Food Facts API (NL filter: `tagtype_0=countries`)
- `src/lib/drink-water-mapping.ts` — Drink name → water percentage mapping
- `src/lib/dutch-foods.ts` — Local NL food database (no `unit` field — all use grams/servingSizeG)
- `src/pages/Admin.tsx` — Invite codes, user management, data reset (admin-only)

### Firebase
- Project: `bodybalance-39bd5`, hosted at `https://bodybalance-39bd5.web.app`
- Auth: email/password + invite code registration
- Firestore structure: `users/{uid}/profile/data`, `users/{uid}/days/{date}`, `users/{uid}/weight/{date}`, `users/{uid}/foods/{localId}`
- Admins: bodybalanceapp@gmail.com, marcelvandernet@gmail.com

## Known Gotchas

- `base: '/'` in vite.config (absolute, not `'./'`) — required for Firebase Hosting
- Dexie boolean index: use `.filter()` not `.equals(1)`
- `useRef<T>(null)` required in React 19
- Open Food Facts: `tagtype_0=countries` for NL filter (not `cc=nl`)
- `isZeroPointFood()` and `getDrinkWaterPercentage()`: use `\b` word-boundary regex, not `.includes()`
- Local foods (`dutch-foods.ts`) have NO `unit` field — only API foods get `unit: 'ml'` via `detectUnit()`
- Html5Qrcode: needs visible DOM element — use `overflow: hidden` + `minHeight: 0`, not `display: none`
- `navigator.permissions.query({name:'camera'})` doesn't work on iOS Safari — use `getUserMedia()` directly
- Dark mode is class-based (`html.dark`), managed via JS, not media query
- `body { position: fixed }` causes blank page — don't use
- Number inputs: `Number('')` === `0` — use string state, convert on calculation
- Invite code validation happens before auth → Firestore rules must `allow read: if true` for inviteCodes
