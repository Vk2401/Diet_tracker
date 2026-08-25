# Gain Tracker

A mobile-first **Next.js PWA** for the *Healthy Weight-Gain Daily Nutrition & Progress Tracker* BRD (v1.0).
Follow a structured seven-day diet plan, log six meals a day, and track calories, protein, hydration and
weekly weight progress toward a goal.

Default plan: **43 kg → 50 kg**, 1,800–1,950 kcal/day, 65–75 g protein/day, 1.8–2.2 L water/day.

---

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

Requires Node 18.18+. No API keys, database or backend — the app is entirely client-side.

---

## Screens

| Route | Screen | What it does |
|---|---|---|
| `/onboarding` | Onboarding | 4 steps: welcome → weights → targets → reminders. Runs once. |
| `/` | Today's dashboard | Meal adherence ring, calorie/protein bars, weight snapshot, six meal cards, hydration, weigh-in, notes. Steps ±2 days. |
| `/meal/[date]/[slot]` | Meal detail | Complete/skip, portion multiplier, manual kcal/protein override, swap to an alternative, per-meal notes. |
| `/plan` | 7-day diet plan | The recurring weekly rotation with per-day totals and swappable alternatives. |
| `/weight` | Weight tracker | Log/edit/remove daily weights, trend chart, weekly averages, goal progress, history. |
| `/progress` | Progress dashboard | Goal ring, weight trend, 14-day averages, daily calorie bars, week-over-week averages. |
| `/report` | Weekly adherence report | Meal adherence, weight change, macro & hydration averages, missed meals, best day, improvements. Steps back week by week. |
| `/reminders` | Reminders | Per-reminder time + on/off, hydration cadence, notification permission. |
| `/settings` | Settings | Profile, editable targets, theme, glass size, week start, JSON export/import, erase all. |

---

## Architecture

```
src/
  app/                    App Router pages (all client components)
  components/             AppShell, BottomNav, TopBar, MealCard, WaterCard,
                          WeightQuickLog, WeightChart, PwaProvider, ui primitives, icons
  lib/
    types.ts              Domain model
    plan.ts               Meal-option catalog + the default 7-day plan
    defaults.ts           Initial state, default targets and reminders
    store.tsx             React context store, debounced localStorage persistence
    nutrition.ts          Per-entry and per-day nutrition resolution
    stats.ts              Weekly averages, goal progress, weekly report
    date.ts               Local-timezone date helpers
    notifications.ts      Reminder scheduling and delivery
public/
  manifest.webmanifest    Installable app manifest with shortcuts
  sw.js                   Offline-first service worker
  icons/                  App, maskable and badge icons
```

### State and storage

All data lives in `localStorage` under `hwg-tracker-state` — nothing is sent anywhere. Writes are
debounced 200 ms so rapid taps (water, portions) don't thrash storage. Loading is deferred to a
mount effect so server and client render the same pristine tree, and `AppShell` shows a spinner
until hydration completes.

**Historical logs are preserved when the plan changes.** A day's meals are only written into
`days[date]` when you interact with them; unlogged days resolve against the recurring plan on read.
Editing the plan therefore affects future days only — anything already logged keeps its original
food, portions and nutrition (BRD §14).

### Nutrition model

`lib/plan.ts` holds a catalog of `MealOption`s (label, ingredient breakdown, planned portion,
estimated kcal/protein), tagged by meal slot. The default week maps each weekday + slot to an
option; every other option for that slot becomes a one-tap alternative, which covers the BRD's
substitutions (dosa/idli/oats, paneer/tofu, chicken/chickpeas/rajma/fish/egg, rice/chapati).

Effective nutrition for a logged meal is `override ?? (option value × portion factor)`, so portion
changes and swaps recalculate automatically while manual entry still wins.

Planned-portion estimates are tuned so each default day lands inside the BRD's 1,800–1,950 kcal
target (Monday: 1,935 kcal / 82 g protein). **Note:** taken at maximum realistic portions the BRD's
written plan would exceed its own calorie target, so the estimates assume moderate portions. Every
target is editable in Settings, and any meal's calories/protein can be overridden directly.

### Progress logic

Goal progress follows the BRD formula exactly:

```
(current − start) / (goal − start) × 100      // default: (current − 43) / 7 × 100
```

`current` is the most recent logged weight. The weekly average is the primary indicator; the trend
chart plots daily entries against a 7-day rolling average, and week-over-week change compares this
week's mean to last week's. **No target date is ever projected** (BRD §8).

### Reminders

Eight configurable reminders (weigh-in, six meals, repeating hydration). A client-only PWA can't
wake itself without a push server, so delivery is best-effort: due reminders fire while the app is
open — on load, every 60 s, and on tab focus — and anything due in the last 30 minutes is caught up
the next time you open the app. Fired reminders are de-duplicated per day.

### PWA

- `sw.js` — network-first for navigations (deploys land immediately) with a cached fallback and an
  `/offline` page; cache-first with background refresh for static assets.
- `PwaProvider` registers the worker, exposes the deferred `beforeinstallprompt` for the in-app
  install banner, and surfaces a "new version ready" refresh prompt.
- Manifest ships `standalone` display, three app shortcuts, and maskable icons.

### Design

A CSS custom-property design system in `globals.css` with a full light and dark palette,
`system`/`light`/`dark` theme override, safe-area insets, tabular figures, and reduced-motion
support. Chart colors are dedicated tokens validated for colorblind separation and contrast against
both surfaces.

---

## Not implemented (BRD §13, explicitly future scope)

Food database, barcode scanning, recipes, grocery list, photo meal logging, Apple Health / Google
Health Connect, PDF/CSV reports, AI meal suggestions and adaptive recommendations.

---

This app supports a nutrition plan and is **not medical advice**. Consult a doctor or dietitian
before significant dietary changes.
